import { writeStringToFileAsync } from '../../../../utilities/writeStringToFileAsync.js';
import { logIn } from './components/logIn.js';
import { readSessionFromFile } from './components/readSessionFromFile.js';
import { refreshSession } from './components/refreshSession.js';
import { validateSession } from './components/validateSession.js';
import { COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN, SESSION_DIRECTORY, SESSION_FILE_NAME } from './constants.js';
import { ISession } from './types.js';

/** Maintains an authenticated web session with Shutterfly. Caches session in memory to minimize disk operations. */
export class Authenticator {
    /** In-memory session. Helps minimize disk operations. */
    _session: ISession | undefined;

    /**
     * Performs repetitive tasks for `authenticate`. (Validates and saves the in-memory `_session`.)
     * 
     * @param shouldWriteSessionToFile - Whether or not to write the in-memory session to file.
     * @param isVerbose - Whether or not to be verbose.
     * @returns Promisified boolean: `true` if all tasks were completed; otherwise `false`. Settles when done.
     */
    async _authenticateHelper(
        shouldWriteSessionToFile: boolean = false,
        sessionDescription: string = 'session',
        isVerbose: boolean = false,
    ): Promise<boolean> {
        const consoleGroup = isVerbose ? console.group : () => {};
        const consoleGroupEnd = isVerbose ? console.groupEnd : () => {};
        const consoleLog = isVerbose ? console.log : () => {};

        if (typeof this._session === 'undefined') {
            return false;
        }

        consoleLog(`\nValidating ${sessionDescription}...`);
        consoleGroup();
        const sessionIsValid = validateSession(this._session, isVerbose);
        consoleGroupEnd();
        consoleLog('...done!');
        if (!sessionIsValid) {
            return false;
        }

        if (shouldWriteSessionToFile) {
            consoleLog(`\nWriting ${sessionDescription} to file...`);
            consoleGroup();
            await writeStringToFileAsync({
                fromString: JSON.stringify(this._session, null, 4),
                toDirectory: SESSION_DIRECTORY,
                toFileName: SESSION_FILE_NAME,
            });
            consoleGroupEnd();
            consoleLog('...done!');
        }

        return true;
    }

    /**
     * Establishes an authenticated session, stores it in memory, and writes it to file.
     * 
     * @param isVerbose - Whether or not to be verbose.
     * @returns Promisified Cognito idToken. Settles when data is ready.
     */
    async authenticate(isVerbose: boolean = false): Promise<string> {
        const consoleGroup = isVerbose ? console.group : () => {};
        const consoleGroupEnd = isVerbose ? console.groupEnd : () => {};
        const consoleLog = isVerbose ? console.log : () => {};

        // Check in-memory session.
        if (await this._authenticateHelper(false, 'in-memory session', isVerbose)) {
            return this.getCognitoIdToken()!; // guaranteed by `_authenticateHelper`
        }

        // If in-memory session does not exist or is invalid, then load from file.
        consoleLog('\nLoading session from file...');
        consoleGroup();
        this._session = await readSessionFromFile(isVerbose);
        consoleGroupEnd();
        consoleLog('...done!');
        if (await this._authenticateHelper(false, 'from-file session', isVerbose)) {
            return this.getCognitoIdToken()!; // guaranteed by `_authenticateHelper`
        }

        // If in-memory session exists now due to the steps above (but it failed validation), then refresh it.
        if (typeof this._session !== 'undefined') {
            consoleLog('\nRefreshing existing session...');
            consoleGroup();
            this._session = await refreshSession(this._session, isVerbose);
            consoleGroupEnd();
            consoleLog('...done!');
            if (await this._authenticateHelper(true, 'refreshed session', isVerbose)) {
                return this.getCognitoIdToken()!; // guaranteed by `_authenticateHelper`
            }
        }

        // If all else failed, then create a new session.
        consoleLog('\nCreating new session...');
        consoleGroup();
        this._session = await logIn();
        consoleGroupEnd();
        consoleLog('...done!');
        if (await this._authenticateHelper(true, 'new session', isVerbose)) {
            return this.getCognitoIdToken()!; // guaranteed by `_authenticateHelper`
        }

        // There's nothing else we can do at this point.
        throw new Error('Failed to authenticate.');
    }

    /**
     * Returns the Cognito idToken from the in-memory session if it exists.
     * 
     * @returns Cognito idToken from in-memory session if it exists; otherwise `undefined`.
     */
    getCognitoIdToken(): string | undefined {
        return this._session?.cognitoTokens.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN))?.value;
    }
}
