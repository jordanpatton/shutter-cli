import { createWriteStream, existsSync, PathLike as TPathLike } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';

/** `writeStreamToFileAsync` parameters. */
export interface IWriteStreamToFileAsyncParameters {
    /** `node:fs.createWriteStream` options. May include `flags`. */
    createWriteStreamOptions?: Parameters<typeof createWriteStream>[1];
    /** Readable stream of data to be written. @see https://nodejs.org/api/stream.html#readable-streams */
    fromStream: Readable;
    /** Whether or not to create the destination directory (aka `toDirectory`) if it does not already exist. */
    shouldMakeDirectory?: boolean;
    /** Destination directory for written file. */
    toDirectory: TPathLike;
    /** File name (base name + extension) for written file. */
    toFileName: string;
}

/**
 * Writes from a given stream to a file at a given path (directory + file name). `async`-compatible.
 * 
 * @param parameters - Parameters.
 * @returns Promisified void. Settles when write operation finishes.
 * 
 * @see https://stackoverflow.com/questions/37614649/how-can-i-download-and-save-a-file-using-the-fetch-api-node-js
 * @see https://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js-without-using-third-party-libraries
 * @see https://nodejs.org/api/fs.html#filehandlecreatewritestreamoptions
 * @see https://nodejs.org/api/fs.html#file-system-flags
 */
export const writeStreamToFileAsync = async ({
    createWriteStreamOptions = { flags: 'wx' },
    fromStream,
    shouldMakeDirectory = false,
    toDirectory,
    toFileName,
}: IWriteStreamToFileAsyncParameters): Promise<void> => {
    // Determine path (directory + file name).
    if (shouldMakeDirectory && !existsSync(toDirectory)) {
        await mkdir(toDirectory);
    }
    const toPath = resolve(String(toDirectory), toFileName);
    // Write stream to path.
    const writeStream = createWriteStream(toPath, createWriteStreamOptions);
    return finished(fromStream.pipe(writeStream));
};
