import { readStringFromFileAsync } from '../../../utilities/readStringFromFileAsync.js';
import { SESSION_DIRECTORY, SESSION_FILE_NAME } from '../constants.js';
import { ISession } from '../types.js';

/**
 * Reads a session from a file and returns it.
 * 
 * @param isVerbose - Whether or not to be verbose.
 * @returns Promisified session (or undefined if none exists).
 */
export const readSessionFromFile = async (isVerbose: boolean = false): Promise<ISession | undefined> => {
    let sessionString: string | undefined;
    try {
        sessionString = await readStringFromFileAsync({ fromPath: `${SESSION_DIRECTORY}/${SESSION_FILE_NAME}` });
        if (isVerbose) {console.log('Successfully read session from file.');}
    } catch (_error) {
        if (isVerbose) {console.log('Failed to read session from file.');}
        return undefined;
    }
    return typeof sessionString === 'string' ? JSON.parse(sessionString) as ISession : undefined;
};
