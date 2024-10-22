import {
    COGNITO_TOKEN_NAME_POSTFIX_ACCESS_TOKEN,
    COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN,
    COGNITO_TOKEN_NAME_POSTFIX_REFRESH_TOKEN,
    SESSION_TIME_TO_LIVE_MILLISECONDS,
} from '../constants.js';
import { ISession } from '../types.js';

/**
 * Determines the validity of a given session. A valid session meets the following criteria:
 * 1. It has not expired.
 * 2. It has the following Cognito tokens: `accessToken`, `idToken`, and `refreshToken`.
 * 
 * @param session - Session to validate.
 * @param isVerbose - Whether or not to be verbose.
 * @returns True if a given session is valid; otherwise false.
 */
export const validateSession = (
    { cognitoLastRefreshTimeUnixMilliseconds, cognitoTokens }: ISession,
    isVerbose: boolean = false,
): boolean => {
    const consoleLog = isVerbose ? console.log : () => {};
    // Check expiration.
    const elapsedMs = Date.now() - cognitoLastRefreshTimeUnixMilliseconds;
    const remainingMs = SESSION_TIME_TO_LIVE_MILLISECONDS - elapsedMs;
    if (remainingMs <= 0) {
        consoleLog(`Session is stale by ${Math.abs(remainingMs)} milliseconds.`);
        return false;
    }
    // Check Cognito tokens.
    const accessToken = cognitoTokens.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_ACCESS_TOKEN));
    if (typeof accessToken?.value !== 'string' || !accessToken.value.length) {
        consoleLog('Session is invalid due to missing accessToken.');
        return false;
    }
    const idToken = cognitoTokens.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN));
    if (typeof idToken?.value !== 'string' || !idToken.value.length) {
        consoleLog('Session is invalid due to missing idToken.');
        return false;
    }
    const refreshToken = cognitoTokens.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_REFRESH_TOKEN));
    if (typeof refreshToken?.value !== 'string' || !refreshToken.value.length) {
        consoleLog('Session is invalid due to missing refreshToken.');
        return false;
    }
    // Session passed all checks.
    consoleLog(`Session is valid with ${remainingMs} milliseconds remaining.`);
    return true;
};
