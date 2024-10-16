import { getCommandLineParameter } from '../../utilities/getCommandLineParameter.js';
import { writeStringToFileAsync } from '../../utilities/writeStringToFileAsync.js';
import { getCognitoIdToken } from './components/getCognitoIdToken.js';
import { logIn } from './components/logIn.js';
import { readSessionFromFile } from './components/readSessionFromFile.js';
import { validateSession } from './components/validateSession.js';
import { SESSION_DIRECTORY, SESSION_FILE_NAME } from './constants.js';

/** `authenticate` parameters. */
interface IAuthenticateParameters {
    /** Whether or not to be verbose. */
    isVerbose?: boolean;
}

/**
 * Parses `authenticate` parameters.
 * 
 * @returns Parsed parameters.
 */
export const parseAuthenticateParameters = (): IAuthenticateParameters => {
    const parsed: IAuthenticateParameters = {};
    // is-verbose (optional): boolean
    const isVerbose = getCommandLineParameter('--is-verbose').value;
    if (typeof isVerbose === 'string') {
        if (isVerbose === 'true' || isVerbose === 'false') {
            parsed.isVerbose = isVerbose === 'true';
            console.log('Parsed is-verbose from command line.');
        } else {
            throw new TypeError('is-verbose (optional) must be true or false.');
        }
    }
    return parsed;
};

/**
 * Establishes an authenticated, validated session.
 * 
 * @param parameters - Parameters.
 * @returns Promisified Amazon Cognito idToken. Settles when data is ready.
 */
export const authenticate = async ({ isVerbose = false }: IAuthenticateParameters): Promise<string> => {
    if (isVerbose) {console.log('\nChecking existing session...');}
    if (isVerbose) {console.group();}
    const oldSession = await readSessionFromFile(isVerbose);
    if (typeof oldSession !== 'undefined' && validateSession(oldSession, isVerbose)) {
        const oldCognitoIdToken = getCognitoIdToken(oldSession.cookies);
        if (typeof oldCognitoIdToken === 'string') {
            return oldCognitoIdToken;
        } else {
            throw new Error('Existing Cognito idToken is invalid.');
        }
    }
    if (isVerbose) {console.groupEnd();}
    if (isVerbose) {console.log('...done!');}

    if (isVerbose) {console.log('\nLogging in to Shutterfly...');}
    if (isVerbose) {console.group();}
    const newSession = await logIn();
    if (typeof newSession === 'undefined') {
        throw new Error('Failed to log in to Shutterfly.');
    }
    if (isVerbose) {console.groupEnd();}
    if (isVerbose) {console.log('...done!');}

    if (isVerbose) {console.log('\nWriting session to file...');}
    if (isVerbose) {console.group();}
    await writeStringToFileAsync({
        fromString: JSON.stringify(newSession, null, 4),
        toDirectory: SESSION_DIRECTORY,
        toFileName: SESSION_FILE_NAME,
    });
    if (isVerbose) {console.groupEnd();}
    if (isVerbose) {console.log('...done!');}

    const newCognitoIdToken = getCognitoIdToken(newSession.cookies);
    if (typeof newCognitoIdToken === 'string') {
        return newCognitoIdToken;
    } else {
        throw new Error('New Cognito idToken is invalid.');
    }
};
