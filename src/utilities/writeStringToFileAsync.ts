import { existsSync, PathLike as TPathLike } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** `writeStringToFileAsync` parameters. */
export interface IWriteStringToFileAsyncParameters {
    /** String to be written. */
    fromString: string;
    /** Whether or not to create the destination directory (aka `toDirectory`) if it does not already exist. */
    shouldMakeDirectory?: boolean;
    /** Destination directory for written file. */
    toDirectory: TPathLike;
    /** File name (base name + extension) for written file. */
    toFileName: string;
    /**
     * `node:fs/promises.writeFile` options. `writeFileOptions` must specify a string-compatible `encoding`, or else the
     * companion function (`readStringFromFileAsync`) will fail when trying to read the written file.
     * @see https://stackoverflow.com/questions/6456864/why-does-node-jss-fs-readfile-return-a-buffer-instead-of-string
     */
    writeFileOptions?: Parameters<typeof writeFile>[2];
}

/**
 * Writes from a given string to a file at a given path (directory + file name). `async`-compatible.
 * 
 * @param parameters - Parameters.
 * @returns Promisified void. Settles when write operation finishes.
 * 
 * @see https://stackoverflow.com/questions/31978347/fs-writefile-in-a-promise-asynchronous-synchronous-stuff
 */
export const writeStringToFileAsync = async ({
    fromString,
    shouldMakeDirectory = false,
    toDirectory,
    toFileName,
    writeFileOptions = { encoding: 'utf8' },
}: IWriteStringToFileAsyncParameters): Promise<void> => {
    // Determine path (directory + file name).
    if (shouldMakeDirectory && !existsSync(toDirectory)) {
        await mkdir(toDirectory);
    }
    const toPath = resolve(String(toDirectory), toFileName);
    // Write string to path.
    return writeFile(toPath, fromString, writeFileOptions);
};
