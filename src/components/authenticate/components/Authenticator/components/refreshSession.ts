import {
    COGNITO_TOKEN_NAME_POSTFIX_ACCESS_TOKEN,
    COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN,
    COGNITO_TOKEN_NAME_POSTFIX_REFRESH_TOKEN,
} from '../constants.js';
import { ICognitoToken, ISession } from '../types.js';

/** Response json format for `GET https://accounts.shutterfly.com/sso/v2/tokens`. */
type TGetTokensResponseJson = ICognitoToken[];

const SHUTTERFLY_TOKENS_URL = 'https://accounts.shutterfly.com/sso/v2/tokens';

/**
 * Fetches tokens. The server API has at least two special functions:
 * 1. If you send `refreshToken` via `cookie` without any other tokens, then the server responds with new values for
 *    `accessToken` and `idToken` in both the response body and a compound `set-cookie` header. It also includes your
 *    existing `refreshToken` in the response body (but not the `set-cookie` header).
 * 2. If you send ALL of your tokens AND `accessToken` or `idToken` have expired or are close to expiring, then the
 *    server refreshes `accessToken` and `idToken` in the same manner as #1 above (response body + `set-cookie`). It
 *    also returns ALL of your existing tokens (including the expired ones) in the response body (but not `set-cookie`).
 *    This means you'll have two entries for `accessToken` and `idToken` with the new ones at the bottom of the array. I
 *    have no idea what the timing threshold is for "close to expiring".
 * It's possible to accomplish the same things (both fetching and refreshing tokens) with a differently-formatted
 * request to `POST https://api2.shutterfly.com/usersvc/api/v1/authenticate`, but that endpoint requires API keys that
 * are embedded in minified JavaScript.
 * 
 * @returns Promisified response json. Settles when data is ready.
 */
const fetchTokensViaApi = async (cookie: string): Promise<TGetTokensResponseJson> => {
    const response = await fetch(SHUTTERFLY_TOKENS_URL, {
        body: null,
        headers: { // Other than `cookie` (required), we don't know which headers are required/optional.
            // 'accept': 'application/json, text/plain, */*',
            // 'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache, no-store, must-revalidate',
            'cookie': cookie,
            'expires': '0',
            'pragma': 'no-cache'
        },
        method: 'GET'
    });
    if (!response.ok) {
        throw new Error(`[${response.status}] ${response.statusText}`);
    }
    return response.json() as Promise<TGetTokensResponseJson>;
};

/**
 * Refreshes an existing session by replacing `accessToken` and `idToken` with new, server-provided values. Also updates
 * the last-refresh timestamp. Does not mutate the input session.
 * 
 * @param session - Existing session.
 * @param isVerbose - Whether or not to be verbose.
 * @returns Promisified refreshed session. Settles when refreshed session is ready.
 */
export const refreshSession = async (
    { cognitoTokens }: ISession,
    isVerbose: boolean = false,
): Promise<ISession | void> => {
    const consoleLog = isVerbose ? console.log : () => {};
    const oldRefreshToken = cognitoTokens.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_REFRESH_TOKEN));
    if (typeof oldRefreshToken?.value !== 'string' || !oldRefreshToken.value.length) {
        consoleLog('Existing Cognito refreshToken is invalid.');
        return;
    }
    consoleLog('Existing Cognito refreshToken appears to be valid.');
    // Capture timestamp immediately before request to improve expiration accuracy.
    const refreshTimeUnixMilliseconds = Date.now();
    // In order to force a refresh of `accessToken` and `idToken`, we only send `refreshToken` here. If we send all
    // of the Cognito tokens, the server may or may not refresh depending on expiration logic that is unknown to us.
    const responseJson = await fetchTokensViaApi(`${oldRefreshToken.name}=${oldRefreshToken.value}`);
    // We don't need to check for duplicate `accessToken` or `idToken` here because we used the simplified refresh
    // above. If `accessToken` and `idToken` exist in the response body with valid values, then they are new.
    const newAccessToken = responseJson.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_ACCESS_TOKEN));
    const newIdToken = responseJson.find(v => v.name.endsWith(COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN));
    if (
        typeof newAccessToken?.value !== 'string' || !newAccessToken.value.length ||
        typeof newIdToken?.value !== 'string' || !newIdToken.value.length
    ) {
        consoleLog('Remote API failed to refresh tokens.');
        return;
    }
    consoleLog('Remote API successfully refreshed tokens.');
    // Create a new session object instead of mutating the input.
    return {
        cognitoLastRefreshTimeUnixMilliseconds: refreshTimeUnixMilliseconds,
        // Replace `accessToken` and `idToken` with refreshed ones. `refreshToken` will technically replace itself, but
        // its value will be the same as before.
        cognitoTokens: [ ...cognitoTokens.filter(v => !responseJson.some(w => w.name === v.name)), ...responseJson ],
    } as ISession;
};
