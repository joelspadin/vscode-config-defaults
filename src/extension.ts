import * as vscode from 'vscode';
import { initAllFiles, initWorkspaceFiles } from './config';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('configDefaults.initializeAllFiles', initAllFiles),
		// TODO: add a command to merge defaults into current user files
	);

	// Automatically update any folders added to the workspace.
	vscode.workspace.onDidChangeWorkspaceFolders(async (e) => {
		for (const folder of e.added) {
			await initWorkspaceFiles(folder);
		}
	}, context.subscriptions);

	// TODO: add a setting to toggle this.
	initAllFiles();
}

export function deactivate() {}
