import { writeStringToFileAsync } from '../../../../utilities/writeStringToFileAsync.js';
import { logIn } from './components/logIn.js';
import { readSessionFromFile } from './components/readSessionFromFile.js';
import { validateSession } from './components/validateSession.js';
import { COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN, SESSION_DIRECTORY, SESSION_FILE_NAME } from './constants.js';
import { ISession } from './types.js';

/** Maintains an authenticated web session with Shutterfly. */
export class Authenticator {
    /** In-memory session. Helps reduce disk read operations. */
    _session: ISession | undefined;

    /**
     * Establishes an authenticated session, stores it in memory, and writes it to a file.
     * 
     * @param isVerbose - Whether or not to be verbose.
     * @returns Promisified Cognito idToken. Settles when data is ready.
     */
    async authenticate(isVerbose: boolean = false): Promise<string> {
        const consoleGroup = isVerbose ? console.group : () => {};
        const consoleGroupEnd = isVerbose ? console.groupEnd : () => {};
        const consoleLog = isVerbose ? console.log : () => {};

        // Hydrate in-memory session from existing session in file.
        if (typeof this._session === 'undefined') {
            consoleLog('\nHydrating session from file...');
            consoleGroup();
            this._session = await readSessionFromFile(isVerbose);
            consoleGroupEnd();
            consoleLog('...done!');
        }

        // Validate existing session.
        if (typeof this._session !== 'undefined') {
            consoleLog('\nValidating existing session...');
            consoleGroup();
            if (validateSession(this._session, isVerbose)) {
                consoleLog('Existing session is valid.');
                const oldCognitoIdToken = this._session.cognitoTokens.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN));
                if (typeof oldCognitoIdToken?.value === 'string' && oldCognitoIdToken.value.length) {
                    consoleLog('Existing Cognito idToken appears to be valid.');
                    consoleGroupEnd();
                    consoleLog('...done!');
                    return oldCognitoIdToken.value;
                } else {
                    consoleLog('Existing Cognito idToken is invalid.');
                }
            } else {
                consoleLog('Existing session is invalid.');
            }
            consoleGroupEnd();
            consoleLog('...done!');
        }

        // TODO: refresh session

        // Session is invalid or non-existent; try to start a new session.
        consoleLog('\nLogging in to Shutterfly...');
        consoleGroup();
        this._session = await logIn();
        if (typeof this._session === 'undefined') {
            throw new Error('Failed to log in to Shutterfly.');
        }
        consoleGroupEnd();
        consoleLog('...done!');

        // Write refreshed or new session to file.
        consoleLog('\nWriting session to file...');
        consoleGroup();
        await writeStringToFileAsync({
            fromString: JSON.stringify(this._session, null, 4),
            toDirectory: SESSION_DIRECTORY,
            toFileName: SESSION_FILE_NAME,
        });
        consoleGroupEnd();
        consoleLog('...done!');

        // Validate refreshed or new session.
        consoleLog('\nValidating new Cognito idToken...');
        consoleGroup();
        const newCognitoIdToken = this._session.cognitoTokens.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN));
        if (typeof newCognitoIdToken?.value === 'string' && newCognitoIdToken.value.length) {
            consoleLog('New Cognito idToken appears to be valid.');
            consoleGroupEnd();
            consoleLog('...done!');
            return newCognitoIdToken.value;
        } else {
            throw new Error('New Cognito idToken is invalid.');
        }
    }
}
