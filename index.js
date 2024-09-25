import puppeteer from 'puppeteer';

import { sleep } from './helpers.js';

let testTimeout;
function test() {
    console.log(Date.now());
    testTimeout = setTimeout(test, 1000);
}
test();

const browser = await puppeteer.launch({ headless: false });
const [page] = await browser.pages(); // use default page
let pageWasPrematurelyClosed = true;
page.once('close', () => {
    clearTimeout(testTimeout);
    // When the page is closed before the puppeteer script is complete, the node process
    // will hang. In that case we must manually terminate the node process. For some
    // unknown reason this dumps an error to stdout unless we first `browser.close()`.
    if (pageWasPrematurelyClosed) {
        console.error('ERROR: Page was prematurely closed.');
        browser.close().finally(() => { process.exit(); });
    }
});

await page.goto('https://accounts.shutterfly.com');
await page.setViewport({ height: 768, width: 1024 });
await sleep(5000);

const emailInputHandle = await page.locator('input#email').waitHandle();
const emailInputValue = await emailInputHandle?.evaluate(element => element.value);
const passwordInputHandle = await page.locator('input#password').waitHandle();
const passwordInputValue = await passwordInputHandle?.evaluate(element => element.value);
if (emailInputValue.length && passwordInputValue.length) {
    console.log(`SUCCESS: Logged in with ${emailInputValue}:${passwordInputValue}`);
} else {
    console.log('FAILURE: Failed to log in.');
}

pageWasPrematurelyClosed = false;
await browser.close();
