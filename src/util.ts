import * as fs from 'fs';
import * as path from 'path';
import * as streamEqual from 'stream-equal';
import * as vscode from 'vscode';

export async function areFilesIdentical(path1: string, path2: string) {
	// Compare sizes first so we don't have to read most files.
	try {
		const [stat1, stat2] = await statFiles(path1, path2);

		if (stat1.size !== stat2.size) {
			return false;
		}
	} catch (error) {
		if (error.code === 'ENOENT') {
			// One of the files doesn't exist. Files must differ.
			return false;
		} else {
			throw error;
		}
	}

	const stream1 = fs.createReadStream(path1);
	const stream2 = fs.createReadStream(path2);

	return await streamEqual(stream1, stream2);
}

/**
 * Utility method to get the basename of a path or URI.
 */
export function basename(file: string | vscode.Uri) {
	return path.basename(file instanceof vscode.Uri ? file.fsPath : file);
}

/**
 * Gets whether a file exists.
 */
export async function exists(path: string) {
	try {
		await fs.promises.access(path);
		return true;
	} catch {
		return false;
	}
}

function statFiles(...paths: readonly string[]) {
	return Promise.all(paths.map(p => fs.promises.stat(p)));
}
