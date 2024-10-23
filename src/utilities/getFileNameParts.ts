/**
 * Returns parts for a given file name. Does not handle compound extensions correctly (example: .tar.gz). Doing so would
 * require a much more complex treatment than we need in this application.
 * 
 * @param fileName - File name.
 * @returns Parts.
 */
export const getFileNameParts = (fileName: string): {
    /** `baseName` from `baseName.extension`. */
    baseName: string;
    /** `extension` from `baseName.extension`. */
    extension: string | undefined;
} => {
    const substrings: string[] = fileName.split('.');
    return substrings.length > 1 ? {
        baseName: substrings.slice(0, -1).join('.'),
        extension: substrings[substrings.length - 1],
    } : {
        baseName: fileName,
        extension: undefined,
    };
};
