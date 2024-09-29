import puppeteer from 'puppeteer';

import {
    BROWSER_INITIAL_HEIGHT_PIXELS,
    BROWSER_INITIAL_WIDTH_PIXELS,
    SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT,
} from './common/constants.js';
import { repeatAsync } from './common/helpers/repeatAsync.js';

/** Whether or not the puppeteer script has completed its operations. */
let puppeteerScriptIsFinished = false;
/** Whether or not we should continue polling for cookies. */
let shouldContinuePollingForCookies = true;

const browser = await puppeteer.launch({
    args: [`--window-size=${BROWSER_INITIAL_WIDTH_PIXELS},${BROWSER_INITIAL_HEIGHT_PIXELS}`],
    defaultViewport: null, // disable default viewport
    headless: false, // render to screen
});
const [page] = await browser.pages(); // use default page
page.once('close', () => {
    shouldContinuePollingForCookies = false; // stop polling for cookies
    // When the page is closed before the puppeteer script is finished, the node process
    // will hang. In that case we must manually terminate the node process. For some
    // unknown reason this dumps an error to stdout unless we first `browser.close()`.
    if (!puppeteerScriptIsFinished) {
        console.error('ERROR: Page was closed prematurely.');
        browser.close().finally(() => {process.exit();});
    }
});

await page.goto(SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT);

// Wait for the user to log in and hydrate their Cognito cookies. While we wait, poll for
// Cognito cookies every 1 second for 60 seconds before giving up.
await repeatAsync(async (STOP_SIGNAL) => {
    console.log('Polling for Cognito cookies...');
    const cookies = await page.cookies();
    const cognitoCookies = cookies.filter(cookie => cookie.name.startsWith('Cognito'));
    if (cognitoCookies.length) {
        console.log('Found Cognito cookies!');
        console.log(cognitoCookies.map(cookie => cookie.name));
        shouldContinuePollingForCookies = false; // stop polling for cookies
    }
    if (!shouldContinuePollingForCookies) {
        return STOP_SIGNAL;
    }
}, 1000, 60000);

puppeteerScriptIsFinished = true;
await browser.close();
