import * as vscode from 'vscode';

export class MimoCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const selectedText = document.getText(range);

    if (!selectedText) return actions;

    const fileRef = `\`\`\`${vscode.workspace.asRelativePath(document.fileName)}\n${selectedText}\n\`\`\``;

    // Explain
    const explainAction = new vscode.CodeAction(
      'MiMo: Explain Code',
      vscode.CodeActionKind.QuickFix
    );
    explainAction.command = {
      command: 'mimo.explainCode',
      title: 'Explain Code with MiMo'
    };
    explainAction.diagnostics = [];
    actions.push(explainAction);

    // Fix
    const fixAction = new vscode.CodeAction(
      'MiMo: Fix Code',
      vscode.CodeActionKind.QuickFix
    );
    fixAction.command = {
      command: 'mimo.fixCode',
      title: 'Fix Code with MiMo'
    };
    actions.push(fixAction);

    // Improve
    const improveAction = new vscode.CodeAction(
      'MiMo: Improve Code',
      vscode.CodeActionKind.RefactorRewrite
    );
    improveAction.command = {
      command: 'mimo.improveCode',
      title: 'Improve Code with MiMo'
    };
    actions.push(improveAction);

    return actions;
  }
}
