import puppeteer from 'puppeteer';

import {
    BROWSER_INITIAL_HEIGHT_PIXELS,
    BROWSER_INITIAL_WIDTH_PIXELS,
    SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT,
} from './constants.js';
import { sleep } from './helpers.js';

let isPollingForCookies = true;
let pageWasPrematurelyClosed = true;

const browser = await puppeteer.launch({
    args: [`--window-size=${BROWSER_INITIAL_WIDTH_PIXELS},${BROWSER_INITIAL_HEIGHT_PIXELS}`],
    defaultViewport: null, // disable default viewport
    headless: false, // render to screen
});
const [page] = await browser.pages(); // use default page
page.once('close', () => {
    isPollingForCookies = false; // stop polling for cookies
    // When the page is closed before the puppeteer script is complete, the node process
    // will hang. In that case we must manually terminate the node process. For some
    // unknown reason this dumps an error to stdout unless we first `browser.close()`.
    if (pageWasPrematurelyClosed) {
        console.error('ERROR: Page was prematurely closed.');
        browser.close().finally(() => { process.exit(); });
    }
});

await page.goto(SHUTTERFLY_LOGIN_URL_WITH_COOKIES_REDIRECT);

while (isPollingForCookies) {
    const cookies = await page.cookies();
    const cognitoCookies = cookies.filter(cookie => cookie.name.startsWith('Cognito'));
    if (cognitoCookies.length) {
        isPollingForCookies = false; // stop polling for cookies
        console.log(cognitoCookies.map(cookie => cookie.name));
    }
    await sleep(1000);
}

pageWasPrematurelyClosed = false;
await browser.close();
