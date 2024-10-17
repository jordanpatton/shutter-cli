import { ISession } from '../types.js';

/** How much earlier before a session expires to force a refresh. Minimizes request failures. */
const SESSION_TIME_TO_LIVE_DISCOUNT_MILLISECONDS = 1000 * 60 * 1; // 1 minute
/** How long an authenticated session lasts before expiring. (Represents a hard limit enforced by server.) */
const SESSION_TIME_TO_LIVE_MILLISECONDS = 1000 * 60 * 60; // 1 hour

/**
 * Determines the validity of a given session.
 * 
 * @param session - Session to validate.
 * @param isVerbose - Whether or not to be verbose.
 * @returns True if a given session is valid; otherwise false.
 */
export const validateSession = (session: ISession, isVerbose: boolean = false): boolean => {
    const consoleLog = isVerbose ? console.log : () => {};
    const discountedTtlMs = SESSION_TIME_TO_LIVE_MILLISECONDS - SESSION_TIME_TO_LIVE_DISCOUNT_MILLISECONDS;
    const elapsedMs = Date.now() - session.startTimeUnixMilliseconds;
    const remainingMs = discountedTtlMs - elapsedMs;
    if (remainingMs > 0) {
        consoleLog(`Session is valid with ${remainingMs} milliseconds remaining.`);
        return true;
    } else {
        consoleLog(`Session is stale by ${Math.abs(remainingMs)} milliseconds.`);
        return false;
    }
};
