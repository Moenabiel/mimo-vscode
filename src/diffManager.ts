import * as vscode from 'vscode';

export class DiffManager {
  private originalContents: Map<string, string> = new Map();

  constructor() {}

  showDiff(filePath: string, original: string, modified: string): void {
    const originalUri = vscode.Uri.file(filePath);
    const modifiedUri = vscode.Uri.parse(`mimo-diff://${filePath}`);

    // Store original content for the provider
    this.originalContents.set(filePath, original);

    // Register content provider if not already done
    if (!this.disposed) {
      vscode.workspace.registerTextDocumentContentProvider('mimo-diff', {
        provideTextDocumentContent: (uri: vscode.Uri) => {
          const path = uri.path.replace(/^\//, '');
          return this.originalContents.get(path) || '';
        }
      });
    }

    // Open diff editor
    vscode.commands.executeCommand('vscode.diff', originalUri, modifiedUri, 
      `MiMo: ${filePath.split(/[/\\]/).pop()}`);
  }

  async applyChange(filePath: string, newContent: string): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    const fullRange = new vscode.Range(
      doc.positionAt(0),
      doc.positionAt(doc.getText().length)
    );
    const edit = new vscode.WorkspaceEdit();
    edit.replace(uri, fullRange, newContent);
    await vscode.workspace.applyEdit(edit);
  }

  private disposed = false;
  dispose() {
    this.disposed = true;
  }
}
