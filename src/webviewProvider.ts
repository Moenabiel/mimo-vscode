import * as vscode from 'vscode';
import { CliManager } from './cliManager';
import { StatusBarManager } from './statusBarManager';
import { SessionManager, Session } from './sessionManager';
import { AgentEvent, ChatMessage } from './types';

export class MimoChatProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'mimo.chat';
  private view: vscode.WebviewView | undefined;
  private messages: ChatMessage[] = [];
  private currentMessageId: string | undefined;
  private sessionManager: SessionManager;

  constructor(
    private extensionUri: vscode.Uri,
    private cliManager: CliManager,
    private statusBar: StatusBarManager,
    context: vscode.ExtensionContext
  ) {
    this.sessionManager = new SessionManager(context);
    this.cliManager.onEvent((event) => this.handleAgentEvent(event));

    // Load active session
    const activeSession = this.sessionManager.getActive();
    if (activeSession && activeSession.messages.length > 0) {
      this.messages = [...activeSession.messages];
    }
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'sendMessage':
          const cwd = message.cwd || this.getWorkspaceFolder();
          await this.handleSendMessage(message.text, cwd);
          break;
        case 'approveAction':
          this.handleApproveAction(message.actionId, true);
          break;
        case 'rejectAction':
          this.handleApproveAction(message.actionId, false);
          break;
        case 'newSession':
          this.handleNewSession();
          break;
        case 'switchSession':
          this.handleSwitchSession(message.sessionId);
          break;
        case 'deleteSession':
          this.handleDeleteSession(message.sessionId);
          break;
        case 'ready':
          this.sendToWebview({
            type: 'init',
            messages: this.messages,
            sessions: this.sessionManager.getAll().map(s => ({
              id: s.id,
              title: s.title,
              updatedAt: s.updatedAt
            })),
            activeSessionId: this.sessionManager.getActive()?.id
          });
          break;
      }
    });
  }

  async handleSendMessage(text: string, cwd: string) {
    const userMsg: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    this.messages.push(userMsg);
    this.sendToWebview({ type: 'message', message: userMsg });

    const assistantMsg: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    this.currentMessageId = assistantMsg.id;
    this.messages.push(assistantMsg);
    this.sendToWebview({ type: 'message', message: assistantMsg });

    // Save to session
    this.saveCurrentSession();

    await this.cliManager.sendMessage(text, cwd);
  }

  private handleAgentEvent(event: AgentEvent) {
    if (!this.currentMessageId) return;
    const msg = this.messages.find(m => m.id === this.currentMessageId);
    if (!msg) return;

    switch (event.type) {
      case 'text_delta':
        msg.content += event.content || '';
        this.sendToWebview({
          type: 'messageUpdate',
          id: msg.id,
          content: msg.content
        });
        break;

      case 'text_done':
        if (event.content && event.content !== msg.content) {
          msg.content = event.content;
        }
        this.currentMessageId = undefined;
        this.saveCurrentSession();
        break;

      case 'tool_call':
        if (event.toolCall) {
          if (!msg.toolCalls) msg.toolCalls = [];
          msg.toolCalls.push(event.toolCall);
          this.sendToWebview({
            type: 'toolCall',
            id: msg.id,
            toolCall: event.toolCall
          });
        }
        break;

      case 'error':
        msg.content += `\n\n**Error:** ${event.error}`;
        this.sendToWebview({
          type: 'messageUpdate',
          id: msg.id,
          content: msg.content
        });
        this.currentMessageId = undefined;
        this.saveCurrentSession();
        break;

      case 'done':
        this.currentMessageId = undefined;
        break;
    }
  }

  private handleApproveAction(actionId: string, approved: boolean) {
    for (const msg of this.messages) {
      if (msg.toolCalls) {
        const tc = msg.toolCalls.find((t: any) => t.id === actionId);
        if (tc) {
          tc.status = approved ? 'approved' : 'rejected';
          break;
        }
      }
    }
    this.cliManager.respondToPermission(actionId, approved);
  }

  private handleNewSession() {
    this.cliManager.stop();
    this.messages = [];
    this.currentMessageId = undefined;

    const session = this.sessionManager.create(this.getWorkspaceFolder());
    this.sendToWebview({
      type: 'newSession',
      session: { id: session.id, title: session.title, updatedAt: session.updatedAt },
      sessions: this.sessionManager.getAll().map(s => ({
        id: s.id, title: s.title, updatedAt: s.updatedAt
      }))
    });
  }

  private handleSwitchSession(sessionId: string) {
    if (this.sessionManager.setActive(sessionId)) {
      const session = this.sessionManager.get(sessionId);
      if (session) {
        this.cliManager.stop();
        this.messages = [...session.messages];
        this.currentMessageId = undefined;
        this.sendToWebview({
          type: 'switchSession',
          messages: this.messages,
          activeSessionId: sessionId
        });
      }
    }
  }

  private handleDeleteSession(sessionId: string) {
    this.sessionManager.delete(sessionId);

    // If we deleted the active session, switch to the most recent
    if (!this.sessionManager.getActive()) {
      this.messages = [];
      this.currentMessageId = undefined;
    } else {
      const active = this.sessionManager.getActive();
      if (active) {
        this.messages = [...active.messages];
      }
    }

    this.sendToWebview({
      type: 'deleteSession',
      sessions: this.sessionManager.getAll().map(s => ({
        id: s.id, title: s.title, updatedAt: s.updatedAt
      })),
      activeSessionId: this.sessionManager.getActive()?.id,
      messages: this.messages
    });
  }

  private saveCurrentSession() {
    const active = this.sessionManager.getActive();
    if (active) {
      this.sessionManager.updateMessages(active.id, this.messages);
    }
  }

  clearMessages() {
    this.handleNewSession();
  }

  addToChatInput(text: string) {
    this.sendToWebview({ type: 'addToInput', text });
  }

  /**
   * Get list of all sessions (for QuickPick).
   */
  getSessionList(): Array<{ id: string; title: string; updatedAt: number }> {
    return this.sessionManager.getAll().map(s => ({
      id: s.id,
      title: s.title,
      updatedAt: s.updatedAt
    }));
  }

  /**
   * Switch to a different session.
   */
  switchSession(sessionId: string) {
    this.handleSwitchSession(sessionId);
  }

  /**
   * Clear all sessions.
   */
  clearAllSessions() {
    this.sessionManager.clearAll();
    this.messages = [];
    this.currentMessageId = undefined;
    this.sendToWebview({ type: 'clear' });
  }

  private getWorkspaceFolder(): string {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      return folders[0].uri.fsPath;
    }
    return process.cwd();
  }

  private sendToWebview(message: any) {
    this.view?.webview.postMessage(message);
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'webview', 'dist', 'app.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'webview', 'dist', 'app.css')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${styleUri}">
  <title>MiMo Chat</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
