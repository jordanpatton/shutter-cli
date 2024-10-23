import { launch } from 'puppeteer';

import { repeatAsync } from '../../../../../utilities/repeatAsync.js';
import {
    COGNITO_TOKEN_COMMENT_DEFAULT_VALUE,
    COGNITO_TOKEN_NAME_PREFIX,
    COGNITO_TOKEN_VERSION_DEFAULT_VALUE,
} from '../constants.js';
import { ISession } from '../types.js';

const BROWSER_INITIAL_HEIGHT_PIXELS = 768;
const BROWSER_INITIAL_WIDTH_PIXELS = 1024;
const SHUTTERFLY_COOKIES_URL = 'https://accounts.shutterfly.com/cookies.html';
const SHUTTERFLY_LOGIN_URL = 'https://accounts.shutterfly.com';
const SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT = `${SHUTTERFLY_LOGIN_URL}/?redirectUri=${encodeURIComponent(SHUTTERFLY_COOKIES_URL)}`;

/**
 * Logs in to Shutterfly. We use puppeteer here because we don't want to fight with recaptcha and any other anti-bot
 * systems that would make things prohbitively difficult.
 * 
 * @returns Promisified session. Settles when puppeteer script is done.
 */
export const logIn = async (): Promise<ISession | undefined> => {
    /** Result. */
    let result: ISession | undefined;
    /** Whether or not the puppeteer script has completed its operations. */
    let puppeteerScriptIsFinished = false;
    /** Whether or not we should continue polling for cookies. */
    let shouldContinuePollingForCookies = true;

    // Set up `browser` and `page`.
    const browser = await launch({
        args: [`--window-size=${BROWSER_INITIAL_WIDTH_PIXELS},${BROWSER_INITIAL_HEIGHT_PIXELS}`],
        defaultViewport: null, // disable default viewport
        headless: false, // render to screen
    });
    const [page] = await browser.pages(); // use default page
    page.once('close', () => {
        shouldContinuePollingForCookies = false; // stop polling for cookies
        // When the page is closed before the puppeteer script is finished, the node
        // process will hang. In that case we must manually terminate the node process.
        // For some unknown reason this dumps an error to stdout unless we first
        // `browser.close()`.
        if (!puppeteerScriptIsFinished) {
            console.error('Page was closed prematurely.');
            browser.close().finally(() => {process.exit();});
        }
    });

    // Go to login page. Redirect to cookie page upon successful login.
    await page.goto(SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT);
    // Wait for user to log in and hydrate Cognito cookies. While waiting, poll for
    // Cognito cookies every 1 second for 60 seconds before giving up.
    await repeatAsync(async (stopSignal) => {
        console.log('Polling for Cognito cookies...');
        const dateNow = Date.now();
        const cookies = await page.cookies();
        const cognitoCookies = cookies.filter(v => v.name.startsWith(COGNITO_TOKEN_NAME_PREFIX));
        if (cognitoCookies.length > 0) {
            console.log('Found Cognito cookies!');
            result = {
                cognitoLastRefreshTimeUnixMilliseconds: dateNow,
                cognitoTokens: cognitoCookies.map(v => ({
                    comment: COGNITO_TOKEN_COMMENT_DEFAULT_VALUE,
                    domain: v.domain,
                    httpOnly: v.httpOnly,
                    maxAge: v.expires - Math.round(dateNow / 1000), // in seconds
                    name: v.name,
                    path: v.path,
                    secure: v.secure,
                    value: v.value,
                    version: COGNITO_TOKEN_VERSION_DEFAULT_VALUE,
                })),
            };
            shouldContinuePollingForCookies = false; // stop polling for cookies
        }
        if (!shouldContinuePollingForCookies) {
            return stopSignal;
        }
    }, 1000, 60000);

    puppeteerScriptIsFinished = true;
    await browser.close();
    return result;
};
