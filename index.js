import puppeteer from 'puppeteer';

import { sleep } from './helpers.js';

let pageWasPrematurelyClosed = true;
let shouldContinuePollingForInput = true;

const browser = await puppeteer.launch({ headless: false });
const [page] = await browser.pages(); // use default page
page.once('close', () => {
    shouldContinuePollingForInput = false;
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

const emailInputHandle = await page.locator('input#email').waitHandle();
const passwordInputHandle = await page.locator('input#password').waitHandle();

while(shouldContinuePollingForInput) {
    const emailInputValue = await emailInputHandle?.evaluate(element => element.value);
    const passwordInputValue = await passwordInputHandle?.evaluate(element => element.value);
    if (emailInputValue.length && passwordInputValue.length) {
        shouldContinuePollingForInput = false;
        console.log(`SUCCESS: Logged in with ${emailInputValue}:${passwordInputValue}.`);
    }
    await sleep(1000);
}

pageWasPrematurelyClosed = false;
await browser.close();
