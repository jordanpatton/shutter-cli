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
export const getFileNameFromContentDispositionHeader = (
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
