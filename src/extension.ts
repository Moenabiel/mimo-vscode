import * as vscode from 'vscode';
import { MimoChatProvider } from './webviewProvider';
import { CliManager } from './cliManager';
import { StatusBarManager } from './statusBarManager';
import { Settings } from './settings';
import { MimoCodeActionProvider } from './codeActionProvider';

let chatProvider: MimoChatProvider | undefined;
let cliManager: CliManager | undefined;
let statusBar: StatusBarManager | undefined;
let codeActionProvider: MimoCodeActionProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  const settings = new Settings();

  // Status bar
  statusBar = new StatusBarManager(context);
  context.subscriptions.push(statusBar);

  // CLI Manager
  cliManager = new CliManager(settings, statusBar);
  context.subscriptions.push(cliManager);

  // Chat webview provider
  chatProvider = new MimoChatProvider(context.extensionUri, cliManager, statusBar, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('mimo.chat', chatProvider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  // Code Action Provider
  codeActionProvider = new MimoCodeActionProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('*', codeActionProvider, {
      providedCodeActionKinds: [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.RefactorRewrite
      ]
    })
  );

  // Register all commands
  registerCommands(context);

  console.log('MiMo Code extension activated');
}

function registerCommands(context: vscode.ExtensionContext) {
  // New Chat
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.newChat', () => {
      cliManager?.stop();
      chatProvider?.clearMessages();
    })
  );

  // Stop Generation
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.stop', () => {
      cliManager?.stop();
    })
  );

  // Add to Chat (selected code)
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.addToChat', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.document.getText(editor.selection);
        const fileName = getRelativePath(editor.document.fileName);
        if (selection) {
          chatProvider?.addToChatInput(`\`\`\`${fileName}\n${selection}\n\`\`\``);
        } else {
          chatProvider?.addToChatInput(`\`\`\`${fileName}\n${editor.document.getText()}\n\`\`\``);
        }
        vscode.commands.executeCommand('mimo.chat.focus');
      }
    })
  );

  // Add Terminal Output to Chat
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.addTerminalOutputToChat', (output: string) => {
      if (output) {
        chatProvider?.addToChatInput(`\`\`\`terminal\n${output}\n\`\`\``);
        vscode.commands.executeCommand('mimo.chat.focus');
      }
    })
  );

  // Explain Code
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.explainCode', () => {
      sendCodeAction('Explain what this code does, line by line:');
    })
  );

  // Fix Code
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.fixCode', () => {
      sendCodeAction('Fix any bugs or issues in this code:');
    })
  );

  // Improve Code
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.improveCode', () => {
      sendCodeAction('Improve this code for readability, performance, and best practices:');
    })
  );

  // Refactor Code
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.refactorCode', () => {
      sendCodeAction('Refactor this code to be cleaner and more maintainable:');
    })
  );

  // Write Tests
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.writeTests', () => {
      sendCodeAction('Write comprehensive tests for this code:');
    })
  );

  // Document Code
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.documentCode', () => {
      sendCodeAction('Add documentation comments to this code:');
    })
  );

  // Open Settings
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.openSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'mimo.');
    })
  );

  // Select Model
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.selectModel', async () => {
      const models = [
        { label: 'MiMo Auto', description: 'Free (limited time)', value: '' },
        { label: 'Claude Sonnet 4', description: 'Anthropic', value: 'anthropic/claude-sonnet-4' },
        { label: 'Claude Opus 4', description: 'Anthropic', value: 'anthropic/claude-opus-4' },
        { label: 'GPT-4.1', description: 'OpenAI', value: 'openai/gpt-4.1' },
        { label: 'Gemini 2.5 Pro', description: 'Google', value: 'google/gemini-2.5-pro' },
        { label: 'DeepSeek R1', description: 'DeepSeek', value: 'deepseek/deepseek-r1' },
      ];

      const selected = await vscode.window.showQuickPick(models, {
        placeHolder: 'Select a model'
      });

      if (selected) {
        const config = vscode.workspace.getConfiguration('mimo');
        await config.update('defaultModel', selected.value, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Model set to: ${selected.label}`);
      }
    })
  );

  // Export Session
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.exportSession', async () => {
      if (!cliManager?.hasServerUrl()) {
        vscode.window.showWarningMessage('No active session to export.');
        return;
      }
      vscode.window.showInformationMessage('Session export coming soon!');
    })
  );

  // Switch Session (via QuickPick)
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.switchSession', async () => {
      const sessions = chatProvider?.getSessionList() || [];
      if (sessions.length === 0) {
        vscode.window.showInformationMessage('No sessions to switch to.');
        return;
      }

      const items = sessions.map(s => ({
        label: s.title,
        description: new Date(s.updatedAt).toLocaleString(),
        id: s.id
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a session'
      });

      if (selected) {
        chatProvider?.switchSession(selected.id);
      }
    })
  );

  // Clear All Sessions
  context.subscriptions.push(
    vscode.commands.registerCommand('mimo.clearAllSessions', async () => {
      const confirm = await vscode.window.showWarningMessage(
        'Delete all session history? This cannot be undone.',
        'Delete All',
        'Cancel'
      );
      if (confirm === 'Delete All') {
        chatProvider?.clearAllSessions();
        vscode.window.showInformationMessage('All sessions deleted.');
      }
    })
  );
}

function sendCodeAction(prefix: string) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const selection = editor.document.getText(editor.selection);
    const fileName = getRelativePath(editor.document.fileName);

    if (!selection) {
      vscode.window.showWarningMessage('Select some code first.');
      return;
    }

    chatProvider?.addToChatInput(`${prefix}\n\`\`\`${fileName}\n${selection}\n\`\`\``);
    vscode.commands.executeCommand('mimo.chat.focus');
  }
}

function getRelativePath(fullPath: string): string {
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    const relative = vscode.workspace.asRelativePath(fullPath);
    return relative;
  }
  return fullPath.split(/[/\\]/).pop() || fullPath;
}

export function deactivate() {
  cliManager?.stop();
}
