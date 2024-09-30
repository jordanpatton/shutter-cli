/**
 * Promise-based sleep that suspends logic flow for `milliseconds`. Example:
 * ```javascript
 * doSomethingBeforeSleep();
 * await sleepAsync(1000); // or `sleepAsync(1000).then(doSomethingAfterSleep);`
 * doSomethingAfterSleep();
 * ```
 * @returns {Promise} Resolves when sleep ends.
 */
export const sleepAsync = (
    /** How long to sleep (in milliseconds). */
    milliseconds: number,
): Promise<void> => new Promise(resolve => setTimeout(resolve, milliseconds));
