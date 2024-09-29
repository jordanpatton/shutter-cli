export const BROWSER_INITIAL_HEIGHT_PIXELS = 768;
export const BROWSER_INITIAL_WIDTH_PIXELS = 1024;
const SHUTTERFLY_COOKIES_URL = 'https://accounts.shutterfly.com/cookies.html';
const SHUTTERFLY_LOGIN_URL = 'https://accounts.shutterfly.com';
export const SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT = `${SHUTTERFLY_LOGIN_URL}/?redirectUri=${encodeURIComponent(SHUTTERFLY_COOKIES_URL)}`;
export const TIME_TO_POLL_FOR_COOKIES_MILLISECONDS = 60 * 1000; // 1 minute
