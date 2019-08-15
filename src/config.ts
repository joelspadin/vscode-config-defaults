import * as fs from 'fs';
import * as vscode from 'vscode';
import { promisify } from 'util';

const DEFAULTS_GLOB_PATTERN = '.vscode/**/*.default.*';
const DEFAULTS_REGEX = /\.default(?=\.[^.]+$)/;

const copyFile = promisify(fs.copyFile);

/**
 * Initializes config files in all workspaces.
 */
export async function initAllFiles() {
	if (vscode.workspace.workspaceFolders) {
		for (const folder of vscode.workspace.workspaceFolders) {
			await initWorkspaceFiles(folder);
		}
	}
}

export async function initWorkspaceFiles(folder: vscode.WorkspaceFolder) {
	const defaultsFiles = await vscode.workspace.findFiles({
		base: folder.uri.fsPath,
		pattern: DEFAULTS_GLOB_PATTERN,
	});

	for (const defaultsFile of defaultsFiles) {
		const userFile = defaultsFile.fsPath.replace(DEFAULTS_REGEX, '');

		if (userFile !== defaultsFile.fsPath) {
			try {
				await copyFile(defaultsFile.fsPath, userFile, fs.constants.COPYFILE_EXCL);
			} catch (ex) {
				// We don't want to overwrite the file if it already exists.
				// Any other error is unexpected.
				if (ex.code !== 'EEXIST') {
					throw ex;
				}
			}
		}
	}
}