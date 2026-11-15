const vscode = require("vscode");

function activate(context) {
  const command = vscode.commands.registerCommand("ases.startProject", async () => {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace) {
      const choice = await vscode.window.showWarningMessage("Open a project folder before starting the ASES interview.", "Open Folder");
      if (choice === "Open Folder") await vscode.commands.executeCommand("workbench.action.files.openFolder");
      return;
    }

    const terminal = vscode.window.createTerminal({ name: "Eureka42 ASES", cwd: workspace.uri.fsPath });
    terminal.show(true);
    terminal.sendText("ases welcome --color && ases interview", true);
  });
  context.subscriptions.push(command);
}

function deactivate() {}

module.exports = { activate, deactivate };
