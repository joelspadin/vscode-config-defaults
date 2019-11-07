import * as fs from 'fs';
import * as streamEqual from 'stream-equal';
import { ENOENT } from 'constants';

export async function areFilesIdentical(path1: string, path2: string) {
	// Compare sizes first so we don't have to read most files.
	try {
		const [stat1, stat2] = await Promise.all(
			[path1, path2].map(fs.promises.stat)
		);

		if (stat1.size !== stat2.size) {
			return false;
		}
	} catch (error) {
		if (error.code === ENOENT) {
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
