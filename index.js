import puppeteer from 'puppeteer';

import { sleep } from './helpers.js';

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.goto('https://accounts.shutterfly.com');
await page.setViewport({ height: 768, width: 1024 });
await sleep(5000);

const emailInputHandle = await page.locator('input#email').waitHandle();
const emailInputText = await emailInputHandle?.evaluate(element => element.textContent);
console.log('emailInputText:', emailInputText);

const signInButtonHandle = await page.locator('button#signInButton.submit').waitHandle();
const signInButtonText = await signInButtonHandle?.evaluate(element => element.textContent);
console.log('signInButtonText:', signInButtonText);

await browser.close();
