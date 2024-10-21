import { SESSION_TIME_TO_LIVE_MILLISECONDS } from '../constants.js';
import { ISession } from '../types.js';

/**
 * Determines the validity of a given session.
 * 
 * @param session - Session to validate.
 * @param isVerbose - Whether or not to be verbose.
 * @returns True if a given session is valid; otherwise false.
 */
export const validateSession = (session: ISession, isVerbose: boolean = false): boolean => {
    const consoleLog = isVerbose ? console.log : () => {};
    const elapsedMs = Date.now() - session.cognitoLastRefreshTimeUnixMilliseconds;
    const remainingMs = SESSION_TIME_TO_LIVE_MILLISECONDS - elapsedMs;
    if (remainingMs > 0) {
        consoleLog(`Session is valid with ${remainingMs} milliseconds remaining.`);
        return true;
    } else {
        consoleLog(`Session is stale by ${Math.abs(remainingMs)} milliseconds.`);
        return false;
    }
};
