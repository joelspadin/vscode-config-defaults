import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { areFilesIdentical, basename, exists } from './util';

const DEFAULTS_GLOB_PATTERN = '.vscode/**/*.default.*';
const DEFAULTS_REGEX = /\.default(?=\.[^.]+$)/;

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
			await copyDefaultsFile(defaultsFile, vscode.Uri.file(userFile));
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
		if (await exists(result.userFile.fsPath)) {
			showDiff(result.defaultsFile, result.userFile);
		} else {
			await promptCopyFile(result.defaultsFile, result.userFile);
		}
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

async function* getChangedFiles(): AsyncGenerator<ChangedFile> {
	if (vscode.workspace.workspaceFolders) {
		for (const workspaceFolder of vscode.workspace.workspaceFolders) {
			for (const defaultsFile of await getDefaultsFiles(workspaceFolder)) {
				const userFile = getUserFile(defaultsFile);

				if (!(await areFilesIdentical(defaultsFile.fsPath, userFile))) {
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

async function copyDefaultsFile(defaultsFile: vscode.Uri, userFile: vscode.Uri) {
	try {
		await fs.promises.copyFile(defaultsFile.fsPath, userFile.fsPath, fs.constants.COPYFILE_EXCL);
	} catch (ex) {
		// We don't want to overwrite the file if it already exists.
		// Any other error is unexpected.
		if (ex.code !== 'EEXIST') {
			throw ex;
		}
	}
}

function showDiff(defaultsFile: vscode.Uri, userFile: vscode.Uri) {
	const title = `${basename(defaultsFile)} ↔ ${basename(userFile)}`;
	vscode.commands.executeCommand('vscode.diff', defaultsFile, userFile, title);
}

async function promptCopyFile(defaultsFile: vscode.Uri, userFile: vscode.Uri) {
	const initialize = `Initialize from ${basename(defaultsFile)}`;
	const response = await vscode.window.showInformationMessage(`${basename(userFile)} does not exist.`, initialize);
	if (response === initialize) {
		await copyDefaultsFile(defaultsFile, userFile);
		vscode.window.showTextDocument(userFile);
	}
}
