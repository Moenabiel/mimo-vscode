import * as vscode from 'vscode';
import { AgentStatus } from './types';

export class StatusBarManager implements vscode.Disposable {
  private item: vscode.StatusBarItem;

  constructor(_context: vscode.ExtensionContext) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.command = 'mimo.newChat';
    this.setStatus('idle');
    this.item.show();
  }

  setStatus(status: AgentStatus) {
    switch (status) {
      case 'running':
        this.item.text = '$(loading~spin) MiMo';
        this.item.tooltip = 'MiMo Code — running';
        this.item.backgroundColor = undefined;
        break;
      case 'thinking':
        this.item.text = '$(clock) MiMo';
        this.item.tooltip = 'MiMo Code — thinking';
        this.item.backgroundColor = undefined;
        break;
      case 'error':
        this.item.text = '$(error) MiMo';
        this.item.tooltip = 'MiMo Code — error';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;
      case 'idle':
      default:
        this.item.text = '$(comment-discussion) MiMo';
        this.item.tooltip = 'MiMo Code — idle (click to start new chat)';
        this.item.backgroundColor = undefined;
        break;
    }
  }

  dispose() {
    this.item.dispose();
  }
}
