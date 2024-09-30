/**
 * Promise-based sleep that suspends logic flow for `milliseconds`. Example:
 * ```javascript
 * doSomethingBeforeSleep();
 * await sleepAsync(1000); // or `sleepAsync(1000).then(doSomethingAfterSleep);`
 * doSomethingAfterSleep();
 * ```
 * @param {number} milliseconds How long to sleep (in milliseconds).
 * @returns {Promise} Resolves when sleep ends.
 */
export const sleepAsync = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));
