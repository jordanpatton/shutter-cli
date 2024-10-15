import { Readable } from 'node:stream';
import { ReadableStream as IReadableStream } from 'node:stream/web';

import { getFileNameFromContentDispositionHeader } from './getFileNameFromContentDispositionHeader.js';
import {
    DEFAULT_NEW_FILE_NAME,
    IWriteStreamToFileAsyncParameters,
    writeStreamToFileAsync,
} from './writeStreamToFileAsync.js';

/** `downloadAsync` parameters. */
export interface IDownloadAsyncParameters {
    /** `options` passed to `fetch(url, options)` for downloading a resource. */
    fetchOptions?: Parameters<typeof fetch>[1];
    /** URL of a resource to be downloaded. */
    fromUrl: Parameters<typeof fetch>[0];
    /** Whether or not to create the destination directory (aka `toDirectory`) if it does not already exist. */
    shouldMakeDirectory?: IWriteStreamToFileAsyncParameters['shouldMakeDirectory'];
    /** Destination directory for downloaded resource. */
    toDirectory?: IWriteStreamToFileAsyncParameters['toDirectory'];
    /** Name for downloaded resource. Defaults to `Content-Disposition` file name in response headers. */
    toFileName?: string | ((contentDispositionFileName: ReturnType<typeof getFileNameFromContentDispositionHeader>) => string);
    /** `options` passed to `createWriteStream(path, options)` for writing a file. May include `flags`. */
    writeStreamOptions?: IWriteStreamToFileAsyncParameters['writeStreamOptions'];
}

/**
 * Downloads `fetchUrl` and writes it to `toDirectory` + `toFileName`. `async`-compatible.
 * 
 * @param parameters - Parameters.
 * @returns Promisified void. Settles when download finishes.
 */
export const downloadAsync = async ({
    fetchOptions,
    fromUrl,
    shouldMakeDirectory,
    toDirectory,
    toFileName,
    writeStreamOptions,
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
        : DEFAULT_NEW_FILE_NAME;
    // Write file.
    return writeStreamToFileAsync({
        fromStream: Readable.fromWeb(response.body as IReadableStream<any>),
        shouldMakeDirectory,
        toDirectory,
        toFileName: _toFileName,
        writeStreamOptions,
    });
};
