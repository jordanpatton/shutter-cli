import { launch } from 'puppeteer';

import { repeatAsync } from '../../../utilities/repeatAsync.js';

const BROWSER_INITIAL_HEIGHT_PIXELS = 768;
const BROWSER_INITIAL_WIDTH_PIXELS = 1024;
const COGNITO_COOKIE_NAME_ID_TOKEN_POSTFIX = '.idToken';
const COGNITO_COOKIE_NAME_PREFIX = 'CognitoIdentityServiceProvider.';
const SHUTTERFLY_COOKIES_URL = 'https://accounts.shutterfly.com/cookies.html';
const SHUTTERFLY_LOGIN_URL = 'https://accounts.shutterfly.com';
const SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT = `${SHUTTERFLY_LOGIN_URL}/?redirectUri=${encodeURIComponent(SHUTTERFLY_COOKIES_URL)}`;

/**
 * Logs in to Shutterfly. We use puppeteer here because we don't want to fight with
 * recaptcha and any other anti-bot systems that would make things prohbitively difficult.
 * 
 * @returns Promisified identification token from Amazon Cognito authentication service.
 *          Settles when puppeteer script is done.
 */
export const logIn = async (): Promise<string | undefined> => {
    /** Cognito idToken. */
    let cognitoIdToken: string | undefined;
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
            console.error('ERROR: Page was closed prematurely.');
            browser.close().finally(() => {process.exit();});
        }
    });

    // Go to login page. Redirect to cookie page upon successful login.
    await page.goto(SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT);
    // Wait for user to log in and hydrate Cognito cookies. While waiting, poll for
    // Cognito cookies every 1 second for 60 seconds before giving up.
    await repeatAsync(async (stopSignal) => {
        console.log('Polling for Cognito cookies...');
        const cookies = await page.cookies();
        cognitoIdToken = cookies.find(v => v.name.startsWith(COGNITO_COOKIE_NAME_PREFIX) && v.name.endsWith(COGNITO_COOKIE_NAME_ID_TOKEN_POSTFIX))?.value;
        if (typeof cognitoIdToken === 'string' && cognitoIdToken.length) {
            console.log('Found Cognito idToken!');
            shouldContinuePollingForCookies = false; // stop polling for cookies
        }
        if (!shouldContinuePollingForCookies) {
            return stopSignal;
        }
    }, 1000, 60000);

    puppeteerScriptIsFinished = true;
    await browser.close();
    return cognitoIdToken;
};
