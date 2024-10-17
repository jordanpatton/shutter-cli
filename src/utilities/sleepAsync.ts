import { generateRandomInteger } from './generateRandomInteger.js';

/**
 * Promise-based sleep that suspends logic flow for `milliseconds`.
 * 
 * @example
 * ```javascript
 * doSomethingBefore();
 * await sleepHelperAsync(1000); // or `sleepHelperAsync(1000).then(doSomethingAfter);`
 * doSomethingAfter();
 * ```
 * 
 * @param milliseconds - How long to sleep (in milliseconds).
 * @returns Promisified void. Settles when sleep ends.
 */
const sleepHelperAsync = (milliseconds: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, milliseconds));

/**
 * Async sleep that suspends logic flow with optional jitter and messaging.
 * 
 * @param fixedMilliseconds - How long to sleep (fixed; in milliseconds).
 * @param jitterMilliseconds - How long to sleep (jitter; in milliseconds).
 * @param message - Callback or primitive for printing a message to stdout during sleep.
 * @returns Promisified void. Settles when sleep ends.
 */
export const sleepAsync = async (
    fixedMilliseconds: number,
    jitterMilliseconds: number = 0,
    message?: ((totalMilliseconds: number) => string) | string,
): Promise<void> => {
    const totalMilliseconds = fixedMilliseconds + generateRandomInteger(0, jitterMilliseconds);
    if (typeof message !== 'undefined') {
        process.stdout.write(typeof message === 'function' ? message(totalMilliseconds) : message);
    }
    await sleepHelperAsync(totalMilliseconds);
    if (typeof message !== 'undefined') {process.stdout.clearLine(0);}
    if (typeof message !== 'undefined') {process.stdout.cursorTo(0);}
};
