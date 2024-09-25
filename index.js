import puppeteer from 'puppeteer';

import { sleep } from './helpers.js';

const browser = await puppeteer.launch({ headless: false });
const [page] = await browser.pages();
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

await browser.close();
