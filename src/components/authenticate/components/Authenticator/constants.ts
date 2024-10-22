/** Default value for `comment` field of Cognito token. */
export const COGNITO_TOKEN_COMMENT_DEFAULT_VALUE = null;
/** Cognito token name postfix for access token. */
export const COGNITO_TOKEN_NAME_POSTFIX_ACCESS_TOKEN = '.accessToken';
/** Cognito token name postfix for id token. */
export const COGNITO_TOKEN_NAME_POSTFIX_ID_TOKEN = '.idToken';
/** Cognito token name postfix for refresh token. */
export const COGNITO_TOKEN_NAME_POSTFIX_REFRESH_TOKEN = '.refreshToken';
/** Cognito token name prefix. */
export const COGNITO_TOKEN_NAME_PREFIX = 'CognitoIdentityServiceProvider.';
/** Default value for `version` field of Cognito token. */
export const COGNITO_TOKEN_VERSION_DEFAULT_VALUE = 0;

/** Directory where session flat file is stored. */
export const SESSION_DIRECTORY = './ignore';
/** File name (base name + extension) of session flat file. */
export const SESSION_FILE_NAME = 'session.json';
/** How much earlier before a session expires to force a refresh. Helps reduce request failures. */
const SESSION_TIME_TO_LIVE_DISCOUNT_MILLISECONDS = 1000 * 60 * 5; // 5 minutes
/**
 * Maximum amount of time before a session expires. ("Session expires" means `accessToken` and `idToken` are rejected by
 * the server.) This value is extremely important because Shutterfly returns incorrect expiration times for some tokens
 * on several of its API endpoints, and we have to manually correct it on our end. Tests indicate that `accessToken` and
 * `idToken` expire 1 hour after creation, but `refreshToken` is much longer-lived (don't know when it expires).
 * Expiration for `clockDrift` and `LastAuthUser` is irrelevant.
 */
const SESSION_TIME_TO_LIVE_MAXIMUM_MILLISECONDS = 1000 * 60 * 60; // 1 hour
/** How long to consider a session "alive" before forcing a refresh. */
export const SESSION_TIME_TO_LIVE_MILLISECONDS = SESSION_TIME_TO_LIVE_MAXIMUM_MILLISECONDS - SESSION_TIME_TO_LIVE_DISCOUNT_MILLISECONDS;
