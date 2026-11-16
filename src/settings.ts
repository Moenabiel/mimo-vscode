import * as vscode from 'vscode';

export class Settings {
  private config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration('mimo');
  }

  getPath(): string {
    return this.config.get<string>('path', '');
  }

  isAutoApproveReads(): boolean {
    return this.config.get<boolean>('autoApproveReads', true);
  }

  isAutoApproveTerminal(): boolean {
    return this.config.get<boolean>('autoApproveTerminal', false);
  }

  getDefaultModel(): string {
    return this.config.get<string>('defaultModel', '');
  }
}
