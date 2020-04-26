import * as vscode from 'vscode';

import { compareFile, initAllFiles, initWorkspaceFiles } from './config';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('configDefaults.initializeAllFiles', initAllFiles),
		vscode.commands.registerCommand('configDefaults.compare', compareFile),
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

export function deactivate() {
	// Nothing to do.
}
