import puppeteer from 'puppeteer';

import {
    BROWSER_INITIAL_HEIGHT_PIXELS,
    BROWSER_INITIAL_WIDTH_PIXELS,
    SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT,
    TIME_TO_POLL_FOR_COOKIES_MILLISECONDS,
} from './common/constants.js';
import { repeatAsync, sleepAsync } from './common/helpers.js';

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
    shouldContinuePollingForCookies = false;
    // When the page is closed before the puppeteer script is finished, the node process
    // will hang. In that case we must manually terminate the node process. For some
    // unknown reason this dumps an error to stdout unless we first `browser.close()`.
    if (!puppeteerScriptIsFinished) {
        console.error('ERROR: Page was closed prematurely.');
        browser.close().finally(() => {process.exit();});
    }
});

await page.goto(SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT);

// Poll for cookies for a limited amount of time, then give up. Do not `await` this
// `sleepAsync` invocation because doing so would prevent the actual polling logic from
// executing before the timer runs out.
sleepAsync(TIME_TO_POLL_FOR_COOKIES_MILLISECONDS).then(() => {
    shouldContinuePollingForCookies = false;
});
await repeatAsync(async () => {
    console.log('Polling for Cognito cookies...');
    const cookies = await page.cookies();
    const cognitoCookies = cookies.filter(cookie => cookie.name.startsWith('Cognito'));
    if (cognitoCookies.length) {
        console.log('Found Cognito cookies!');
        console.log(cognitoCookies.map(cookie => cookie.name));
        shouldContinuePollingForCookies = false; // stop polling for cookies
    }
    return shouldContinuePollingForCookies;
});

puppeteerScriptIsFinished = true;
await browser.close();
