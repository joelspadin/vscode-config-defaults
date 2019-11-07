import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { promisify } from 'util';
import { areFilesIdentical } from './util';

const DEFAULTS_GLOB_PATTERN = '.vscode/**/*.default.*';
const DEFAULTS_REGEX = /\.default(?=\.[^.]+$)/;

const copyFile = promisify(fs.copyFile);

interface ChangedFile {
	workspaceFolder: vscode.WorkspaceFolder;
	defaultsFile: vscode.Uri;
	userFile: vscode.Uri;
}

type ChangedFileItem = vscode.QuickPickItem & ChangedFile;

/**
 * Initializes config files in all workspace folders.
 */
export async function initAllFiles() {
	if (vscode.workspace.workspaceFolders) {
		for (const folder of vscode.workspace.workspaceFolders) {
			await initWorkspaceFiles(folder);
		}
	}
}

/**
 * Initializes config files in one workspace folder.
 */
export async function initWorkspaceFiles(folder: vscode.WorkspaceFolder) {
	for (const defaultsFile of await getDefaultsFiles(folder)) {
		const userFile = getUserFile(defaultsFile);

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

/**
 * Shows a selection list of config files that differ from their defaults, and
 * opens a diff between the defaults and the current file.
 */
export async function compareFile() {
	const result = await vscode.window.showQuickPick(getChangedFilePickItems(), {
		placeHolder: 'The following files differ from their defaults:',
	});

	if (result) {
		const title = `${path.basename(result.defaultsFile.fsPath)} ↔ ${path.basename(result.userFile.fsPath)}`;
		vscode.commands.executeCommand('vscode.diff', result.defaultsFile, result.userFile, title);
	}
}

async function getDefaultsFiles(folder: vscode.WorkspaceFolder) {
	return await vscode.workspace.findFiles({
		base: folder.uri.fsPath,
		pattern: DEFAULTS_GLOB_PATTERN,
	});
}

function getUserFile(defaultsFile: vscode.Uri) {
	return defaultsFile.fsPath.replace(DEFAULTS_REGEX, '');
}

async function *getChangedFiles(): AsyncGenerator<ChangedFile> {
	if (vscode.workspace.workspaceFolders) {
		for (const workspaceFolder of vscode.workspace.workspaceFolders) {
			for (const defaultsFile of await getDefaultsFiles(workspaceFolder)) {
				const userFile = getUserFile(defaultsFile);

				if (!await areFilesIdentical(defaultsFile.fsPath, userFile)) {
					yield {
						workspaceFolder,
						defaultsFile,
						userFile: vscode.Uri.file(userFile),
					};
				}
			}
		}
	}
}

async function getChangedFilePickItems() {
	const items: ChangedFileItem[] = [];

	const hasMultipleFolders = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1;

	for await (const file of getChangedFiles()) {
		const root = path.resolve(file.workspaceFolder.uri.fsPath, '.vscode');

		items.push({
			label: path.relative(root, file.userFile.fsPath),
			description: hasMultipleFolders ? file.workspaceFolder.name : undefined,
			...file,
		});
	}

	return items;
}
