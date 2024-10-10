// TODO: move not-so-common constants to their only place of use
export const BROWSER_INITIAL_HEIGHT_PIXELS = 768;
export const BROWSER_INITIAL_WIDTH_PIXELS = 1024;
export const COGNITO_COOKIE_NAME_ID_TOKEN_POSTFIX = '.idToken';
export const COGNITO_COOKIE_NAME_PREFIX = 'CognitoIdentityServiceProvider.';
export const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const SHUTTERFLY_COOKIES_URL = 'https://accounts.shutterfly.com/cookies.html';
const SHUTTERFLY_LOGIN_URL = 'https://accounts.shutterfly.com';
export const SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT = `${SHUTTERFLY_LOGIN_URL}/?redirectUri=${encodeURIComponent(SHUTTERFLY_COOKIES_URL)}`;
export const THISLIFE_DOWNLOAD_URL = 'https://io.thislife.com/download';
export const THISLIFE_JSON_URL = 'https://cmd.thislife.com/json';
