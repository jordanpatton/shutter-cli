import { Readable } from 'node:stream';
import { ReadableStream as IReadableStream } from 'node:stream/web';

import { getFileNameFromContentDispositionHeader } from './getFileNameFromContentDispositionHeader.js';
import { IWriteStreamToFileAsyncParameters, writeStreamToFileAsync } from './writeStreamToFileAsync.js';

/** `downloadAsync` parameters. */
export interface IDownloadAsyncParameters {
    /** `node:fs.createWriteStream` options. May include `flags`. */
    createWriteStreamOptions?: IWriteStreamToFileAsyncParameters['createWriteStreamOptions'];
    /** `options` passed to `fetch(url, options)` for downloading a resource. */
    fetchOptions?: Parameters<typeof fetch>[1];
    /** URL of a resource to be downloaded. */
    fromUrl: Parameters<typeof fetch>[0];
    /** Whether or not to create the destination directory (aka `toDirectory`) if it does not already exist. */
    shouldMakeDirectory?: IWriteStreamToFileAsyncParameters['shouldMakeDirectory'];
    /** Destination directory for downloaded resource. */
    toDirectory?: IWriteStreamToFileAsyncParameters['toDirectory'];
    /** File name (base name + extension) for downloaded resource. Defaults to `Content-Disposition` file name in response headers. */
    toFileName?: IWriteStreamToFileAsyncParameters['toFileName'] | ((contentDispositionFileName: ReturnType<typeof getFileNameFromContentDispositionHeader>) => IWriteStreamToFileAsyncParameters['toFileName']);
}

/** Default directory for downloaded files. */
const DEFAULT_DOWNLOAD_DIRECTORY = '.';
/** Default file name (base name + extension) for a downloaded file. */
export const DEFAULT_DOWNLOAD_FILE_NAME = 'untitled';

/**
 * Downloads `fetchUrl` and writes it to `toDirectory` + `toFileName`. `async`-compatible.
 * 
 * @param parameters - Parameters.
 * @returns Promisified void. Settles when download finishes.
 */
export const downloadAsync = async ({
    createWriteStreamOptions,
    fetchOptions,
    fromUrl,
    shouldMakeDirectory,
    toDirectory = DEFAULT_DOWNLOAD_DIRECTORY,
    toFileName = DEFAULT_DOWNLOAD_FILE_NAME,
}: IDownloadAsyncParameters): Promise<void> => {
    // Request file.
    const response = await fetch(fromUrl, fetchOptions);
    if (!response.ok) {
        throw new Error(`[${response.status}] ${response.statusText}`);
    }
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
        : DEFAULT_DOWNLOAD_FILE_NAME;
    // Write file.
    return writeStreamToFileAsync({
        createWriteStreamOptions,
        fromStream: Readable.fromWeb(response.body as IReadableStream<any>),
        shouldMakeDirectory,
        toDirectory,
        toFileName: _toFileName,
    });
};
