import * as vscode from 'vscode';
import { Settings } from './settings';
import { StatusBarManager } from './statusBarManager';
import { AgentEvent, AgentStatus } from './types';

/**
 * Manages the MiMo Code headless server and API client.
 * Uses @mimo-ai/sdk for server lifecycle and HTTP communication.
 */
export class CliManager implements vscode.Disposable {
  private serverUrl: string | undefined;
  private onEventCallback: ((event: AgentEvent) => void) | undefined;
  private eventSource: any | undefined;
  private currentSessionId: string | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private settings: Settings,
    private statusBar: StatusBarManager
  ) {}

  onEvent(callback: (event: AgentEvent) => void) {
    this.onEventCallback = callback;
  }

  /**
   * Start the MiMo Code headless server.
   * Returns the server URL on success.
   */
  async startServer(): Promise<string | null> {
    try {
      this.setStatus('thinking');

      // Find the mimo binary
      const mimoPath = await this.findMimoBinary();
      if (!mimoPath) {
        this.emitEvent({
          type: 'error',
          error: 'MiMo Code binary not found. Set mimo.path in settings.'
        });
        this.setStatus('error');
        return null;
      }

      // Spawn the headless server
      const { spawn } = require('child_process');
      const port = 0; // Random available port

      const serverProcess = spawn(mimoPath, [
        'serve',
        '--port', String(port),
        '--hostname', '127.0.0.1'
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return new Promise((resolve) => {
        let output = '';

        serverProcess.stdout?.on('data', (data: Buffer) => {
          output += data.toString();

          // Look for the listening URL in output
          const urlMatch = output.match(/(?:listening|server running|started)\s+on\s+(http:\/\/[^\s]+)/i);
          if (urlMatch) {
            this.serverUrl = urlMatch[1];
            this.setStatus('idle');
            resolve(this.serverUrl);
          }

          // Also try JSON format
          try {
            const json = JSON.parse(data.toString().trim());
            if (json.url || json.port) {
              this.serverUrl = json.url || `http://127.0.0.1:${json.port}`;
              this.setStatus('idle');
              resolve(this.serverUrl!);
            }
          } catch {}
        });

        serverProcess.stderr?.on('data', (data: Buffer) => {
          console.error('[MiMo Server stderr]', data.toString());
        });

        serverProcess.on('error', (err: Error) => {
          this.emitEvent({ type: 'error', error: `Server start failed: ${err.message}` });
          this.setStatus('error');
          resolve(null);
        });

        serverProcess.on('close', (code: number) => {
          if (!this.serverUrl) {
            this.emitEvent({ type: 'error', error: `Server exited with code ${code}` });
            this.setStatus('error');
            resolve(null);
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.serverUrl) {
            serverProcess.kill();
            this.emitEvent({ type: 'error', error: 'Server start timed out (10s)' });
            this.setStatus('error');
            resolve(null);
          }
        }, 10000);
      });

    } catch (err: any) {
      this.emitEvent({ type: 'error', error: err.message });
      this.setStatus('error');
      return null;
    }
  }

  /**
   * Send a message to the current session.
   * Creates a new session if none exists.
   */
  async sendMessage(text: string, cwd: string): Promise<void> {
    if (!this.serverUrl) {
      const url = await this.startServer();
      if (!url) return;
    }

    this.setStatus('running');

    try {
      // Create session if needed
      if (!this.currentSessionId) {
        this.currentSessionId = await this.createSession(cwd);
      }

      // Send the prompt
      await this.sendPrompt(this.currentSessionId, text);

      // Subscribe to events
      this.subscribeToEvents(this.currentSessionId);

    } catch (err: any) {
      this.emitEvent({ type: 'error', error: err.message });
      this.setStatus('error');
    }
  }

  /**
   * Stop the current generation.
   */
  stop() {
    if (this.currentSessionId && this.serverUrl) {
      fetch(`${this.serverUrl}/session/${this.currentSessionId}/abort`, {
        method: 'POST'
      }).catch(() => {});
    }
    this.disconnectEvents();
    this.setStatus('idle');
  }

  /**
   * Respond to a permission request from the agent.
   */
  async respondToPermission(permissionId: string, approved: boolean): Promise<void> {
    if (!this.serverUrl || !this.currentSessionId) return;

    try {
      await fetch(`${this.serverUrl}/session/${this.currentSessionId}/permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: permissionId,
          reply: approved ? 'approved' : 'rejected'
        })
      });
    } catch (err) {
      console.error('[MiMo] Failed to respond to permission:', err);
    }
  }

  /**
   * Create a new session on the server.
   */
  private async createSession(cwd: string): Promise<string> {
    const response = await fetch(`${this.serverUrl}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mimocode-directory': cwd
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.id || data.sessionID;
  }

  /**
   * Send a prompt to a session.
   */
  private async sendPrompt(sessionId: string, text: string): Promise<void> {
    const response = await fetch(`${this.serverUrl}/session/${sessionId}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parts: [{ type: 'text', text }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send prompt: ${response.statusText}`);
    }
  }

  /**
   * Subscribe to SSE events for a session.
   */
  private subscribeToEvents(sessionId: string) {
    this.disconnectEvents();

    try {
      const EventSource = require('eventsource');
      this.eventSource = new EventSource(
        `${this.serverUrl}/session/${sessionId}/event`
      );

      this.eventSource.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerEvent(data);
        } catch {}
      };

      this.eventSource.onerror = () => {
        console.error('[MiMo SSE] Connection error');
      };

    } catch (err) {
      console.error('[MiMo SSE] Failed to connect:', err);
    }
  }

  /**
   * Handle an event from the server SSE stream.
   */
  private handleServerEvent(event: any) {
    const eventType = event.type || event.event;

    switch (eventType) {
      case 'message.part.delta':
        this.emitEvent({
          type: 'text_delta',
          content: event.properties?.text || event.data?.text || ''
        });
        break;

      case 'permission.asked':
        // Show VS Code permission dialog
        this.showPermissionDialog(event);
        break;

      case 'permission.replied':
        // Permission handled
        break;

      case 'session.idle':
        this.emitEvent({ type: 'text_done' });
        this.emitEvent({ type: 'done' });
        this.setStatus('idle');
        break;

      case 'session.error':
        this.emitEvent({
          type: 'error',
          error: event.properties?.message || 'Session error'
        });
        this.setStatus('error');
        break;

      case 'session.status':
        const status = event.properties?.status;
        if (status === 'running') {
          this.setStatus('running');
        } else if (status === 'idle') {
          this.setStatus('idle');
        }
        break;

      case 'actor.status':
        // Sub-agent status update
        break;

      case 'metrics.model_call':
        // Token/cost tracking
        break;

      default:
        // Unknown event type — log for debugging
        console.log('[MiMo Event]', eventType, event);
    }
  }

  /**
   * Show a VS Code QuickPick for permission requests.
   */
  private async showPermissionDialog(event: any) {
    const permissionId = event.properties?.id;
    const toolName = event.properties?.tool || 'unknown';
    const description = event.properties?.description || '';

    const choice = await vscode.window.showInformationMessage(
      `MiMo wants to: ${toolName}\n${description}`,
      'Approve',
      'Reject',
      'Approve All'
    );

    if (!this.serverUrl || !this.currentSessionId) return;

    const reply = choice === 'Approve' ? 'approved'
      : choice === 'Reject' ? 'rejected'
      : choice === 'Approve All' ? 'auto-approved'
      : 'rejected';

    await fetch(`${this.serverUrl}/session/${this.currentSessionId}/permission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: permissionId,
        reply
      })
    }).catch(() => {});
  }

  private disconnectEvents() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }

  /**
   * Check if the server is running.
   */
  hasServerUrl(): boolean {
    return !!this.serverUrl;
  }

  private emitEvent(event: AgentEvent) {
    this.onEventCallback?.(event);
  }

  private setStatus(status: AgentStatus) {
    this.statusBar.setStatus(status);
  }

  private async findMimoBinary(): Promise<string | null> {
    const configPath = this.settings.getPath();
    console.log('[MiMo] Settings path:', configPath);
    if (configPath) return configPath;

    // Try to find mimo in common locations
    const { execSync } = require('child_process');
    const fs = require('fs');

    // Check common install locations
    const home = process.env.USERPROFILE || process.env.HOME || '';
    const commonPaths = [
      `${home}\\.mimocode\\bin\\mimo.exe`,
      `${home}\\.mimocode\\bin\\mimo`,
      `${home}\\AppData\\Roaming\\npm\\mimo.cmd`
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        console.log('[MiMo] Found binary at:', p);
        return p;
      }
    }

    // Try PATH
    try {
      const result = execSync('where mimo', {
        encoding: 'utf-8',
        timeout: 5000
      }).trim();
      if (result) {
        console.log('[MiMo] Found via PATH:', result);
        return result.split('\n')[0];
      }
    } catch {}

    console.log('[MiMo] Binary not found');
    return null;
  }

  dispose() {
    this.stop();
    this.disconnectEvents();
    this.disposables.forEach(d => d.dispose());
  }
}
