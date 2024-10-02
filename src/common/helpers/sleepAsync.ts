/**
 * Promise-based sleep that suspends logic flow for `milliseconds`.
 * @example
 * ```javascript
 * doSomethingBeforeSleep();
 * await sleepAsync(1000); // or `sleepAsync(1000).then(doSomethingAfterSleep);`
 * doSomethingAfterSleep();
 * ```
 * @param milliseconds - How long to sleep (in milliseconds).
 * @returns Promisified void. Settles when sleep ends.
 */
export const sleepAsync = (milliseconds: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, milliseconds));
