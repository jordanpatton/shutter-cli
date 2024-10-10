import { createWriteStream, existsSync, PathLike as TPathLike } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { ReadableStream as IReadableStream } from 'node:stream/web';

/** `downloadAsync` parameters. */
export interface IDownloadAsyncParameters {
    /** `options` passed to `fetch(url, options)` for downloading a resource. */
    fetchOptions?: Parameters<typeof fetch>[1];
    /** URL of a resource to be downloaded. */
    fromUrl: Parameters<typeof fetch>[0];
    /** Whether or not to create the destination directory (aka `toDirectory`) if it does not already exist. */
    shouldMakeDirectory?: boolean;
    /** Destination directory for downloaded resource. */
    toDirectory: TPathLike,
    /** Name for downloaded resource. Defaults to `Content-Disposition` file name in response headers. */
    toFileName?: string | ((contentDispositionFileName: ReturnType<typeof getFileNameFromContentDispositionHeader>) => string);
    /** `options` passed to `createWriteStream(path, options)` for writing a file. May include `flags`. */
    writeStreamOptions?: Parameters<typeof createWriteStream>[1],
}

export const DEFAULT_FILE_NAME = 'untitled';

/**
 * Returns the file name from a `Content-Disposition` header. For CORS requests, the
 * `Access-Control-Expose-Headers` header must be set on the server or else the
 * `Content-Disposition` header will not be present in the response. When used with nodejs
 * (not a browser) CORS does not apply, and you don't need to worry about it.
 * 
 * `Content-Disposition` headers come in some pretty weird formats. Examples:
 * @example inline; filename="simple.jpg"
 * @example inline; filename="with spaces.jpg"
 * @example attachment; filename=Naïve file.txt
 * @example attachment; filename*=UTF-8''Na%C3%AFve%20file.txt
 * @example attachment; filename=Na%C3%AFve%20file.txt
 * 
 * @param contentDispositionHeader - `Content-Disposition` header.
 * @returns File name.
 * 
 * @see https://stackoverflow.com/questions/49286221/how-to-get-the-filename-from-a-file-downloaded-using-javascript-fetch-api
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
 * @see https://learn.microsoft.com/en-us/previous-versions/visualstudio/visual-studio-2015/code-quality/ca1308-normalize-strings-to-uppercase
 */
const getFileNameFromContentDispositionHeader = (
    contentDispositionHeader: ReturnType<Headers['get']>,
): string | undefined => {
    if (typeof contentDispositionHeader === 'string') {
        // Use an array instead of an object because the Content-Disposition header could
        // contain duplicate keys. Using an object would cause duplicates to overwrite one
        // another, but an array preserves everything.
        const keyValuePairs: { key: string, value: string | undefined }[] = contentDispositionHeader
            .split(';')
            .filter(v => v.trim().length)
            .map(v => {
                const [key, value] = v.split('=').map(w => w.trim());
                return { key, value };
            });
        // Use uppercase for case-insensitive substring comparisons because lowercase has issues.
        const filenameValue = keyValuePairs.find(v => v.key.toUpperCase().includes('FILENAME'))?.value;
        // Apply final formatting.
        return typeof filenameValue !== 'string'
            ? undefined
            : filenameValue.toUpperCase().startsWith("UTF-8''")
            ? decodeURIComponent(filenameValue.replace(/utf-8''/i, '')) // decode
            : filenameValue.replace(/['"]/g, ''); // remove quotes
    }
    return undefined;
};

/**
 * Downloads `fetchUrl` and writes it to `toDirectory` + `toFileName`. `async`-compatible.
 * 
 * @param parameters - Parameters.
 * @returns Promisified void. Settles when download finishes.
 * 
 * @see https://stackoverflow.com/questions/37614649/how-can-i-download-and-save-a-file-using-the-fetch-api-node-js
 * @see https://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js-without-using-third-party-libraries
 * @see https://nodejs.org/api/fs.html#filehandlecreatewritestreamoptions
 * @see https://nodejs.org/api/fs.html#file-system-flags
 */
export const downloadAsync = async ({
    fetchOptions,
    fromUrl,
    shouldMakeDirectory = false,
    toDirectory,
    toFileName,
    writeStreamOptions = { flags: 'wx' },
}: IDownloadAsyncParameters): Promise<void> => {
    // Request file.
    const response = await fetch(fromUrl, fetchOptions);
    if (response.body === null) {
        throw new Error('Response body is null.');
    }
    // Determine file name.
    const contentDispositionFileName = getFileNameFromContentDispositionHeader(response.headers.get('Content-Disposition'));
    const _toFileName: string = typeof toFileName === 'string'
        ? toFileName
        : typeof toFileName === 'function'
        ? toFileName(contentDispositionFileName)
        : typeof contentDispositionFileName === 'string'
        ? contentDispositionFileName
        : DEFAULT_FILE_NAME;
    // Determine path (directory + file name).
    if (shouldMakeDirectory && !existsSync(toDirectory)) {
        await mkdir(toDirectory);
    }
    const toPath = resolve(String(toDirectory), _toFileName);
    // Write file to path.
    const writeStream = createWriteStream(toPath, writeStreamOptions);
    return finished(Readable.fromWeb(response.body as IReadableStream<any>).pipe(writeStream));
};
