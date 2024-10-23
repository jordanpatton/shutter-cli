/**
 * Parses the command line for a given parameter and returns its value.
 * 
 * @param key - Key for a command line parameter.
 * @returns Whether or not the `key` is present and the value associated with that `key`.
 */
export const getCommandLineParameter = (key: string) : {
    keyIsPresent: boolean;
    value: string | undefined;
} => {
    // Item 0 is the path to the node executable.
    // Item 1 is the path to the entry-point script.
    // Any further items are optional parameters.
    const argvSlice = process.argv.slice(2);
    const keyIndex = argvSlice.indexOf(key);
    return {
        keyIsPresent: keyIndex !== -1,
        value: (keyIndex !== -1 && keyIndex + 1 < argvSlice.length) ? argvSlice[keyIndex + 1] : undefined,
    };
};
