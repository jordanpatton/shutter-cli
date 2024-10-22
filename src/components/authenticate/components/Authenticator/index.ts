import { writeStringToFileAsync } from '../../../../utilities/writeStringToFileAsync.js';
import { logIn } from './components/logIn.js';
import { readSessionFromFile } from './components/readSessionFromFile.js';
import { refreshSession } from './components/refreshSession.js';
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

        // .............................................................................................................
        // 1. SHORT CIRCUIT: Check for an existing, valid session and return early. (No need to write it to file.)
        // 1a. If in-memory session is undefined, then try to load it from file.
        if (typeof this._session === 'undefined') {
            consoleLog('\nLoading session from file...');
            consoleGroup();
            this._session = await readSessionFromFile(isVerbose);
            consoleGroupEnd();
            consoleLog('...done!');
        }
        // 1b. If in-memory session already exists or was loaded from file, then validate it and return early.
        if (typeof this._session !== 'undefined') {
            consoleLog('\nValidating existing session...');
            consoleGroup();
            if (validateSession(this._session, isVerbose)) {
                consoleGroupEnd();
                consoleLog('...done!');
                // `validateSession` guarantees `idToken` exists and is a non-empty string.
                return this._session.cognitoTokens.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN))!.value;
            }
            consoleGroupEnd();
            consoleLog('...done!');
        }
        // .............................................................................................................

        // .............................................................................................................
        // 2. REFRESH EXISTING SESSION: Refresh an existing, invalid session. Validate it, write it to file, and return.
        // 2a. If in-memory session already exists or was loaded from file, and it failed validation, then refresh it.
        if (typeof this._session !== 'undefined') {
            consoleLog('\nRefreshing existing session...');
            consoleGroup();
            this._session = await refreshSession(this._session, isVerbose);
            consoleGroupEnd();
            consoleLog('...done!');
        }
        // 2b. If session refreshed successfully, then validate it.
        if (typeof this._session !== 'undefined') {
            consoleLog('\nValidating refreshed session...');
            consoleGroup();
            if (validateSession(this._session, isVerbose)) {
                consoleGroupEnd();
                consoleLog('...done!');
                // 2c. Write refreshed session to file and return.
                consoleLog('\nWriting refreshed session to file...');
                consoleGroup();
                await writeStringToFileAsync({
                    fromString: JSON.stringify(this._session, null, 4),
                    toDirectory: SESSION_DIRECTORY,
                    toFileName: SESSION_FILE_NAME,
                });
                consoleGroupEnd();
                consoleLog('...done!');
                // `validateSession` guarantees `idToken` exists and is a non-empty string.
                return this._session.cognitoTokens.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN))!.value;
            }
            consoleGroupEnd();
            consoleLog('...done!');
        }
        // .............................................................................................................

        // .............................................................................................................
        // 3. CREATE NEW SESSION: Create a new session, validate it, write it to file, and return.
        // 3a. If all else failed, then create a new session.
        consoleLog('\nCreating new session...');
        consoleGroup();
        this._session = await logIn();
        consoleGroupEnd();
        consoleLog('...done!');
        // 3b. If new session was created successfully, then validate it.
        if (typeof this._session !== 'undefined') {
            consoleLog('\nValidating new session...');
            consoleGroup();
            if (validateSession(this._session, isVerbose)) {
                consoleGroupEnd();
                consoleLog('...done!');
                // 3c. Write new session to file and return.
                consoleLog('\nWriting new session to file...');
                consoleGroup();
                await writeStringToFileAsync({
                    fromString: JSON.stringify(this._session, null, 4),
                    toDirectory: SESSION_DIRECTORY,
                    toFileName: SESSION_FILE_NAME,
                });
                consoleGroupEnd();
                consoleLog('...done!');
                // `validateSession` guarantees `idToken` exists and is a non-empty string.
                return this._session.cognitoTokens.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN))!.value;
            }
            consoleGroupEnd();
            consoleLog('...done!');
        }
        // .............................................................................................................

        // There's nothing else we can do at this point.
        throw new Error('Failed to authenticate.');
    }
}
