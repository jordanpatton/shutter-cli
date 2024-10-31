import { promisifyByException } from './promisifyByException.js';
import { sleepAsync } from './sleepAsync.js';

/** `tryUntilAsyncHelper` options. */
interface ITryUntilAsyncHelperOptions {
    /** Whether or not to be verbose. */
    isVerbose?: boolean;
    /** How many more times to try before giving up. */
    remainingNumberOfTries?: number;
    /** How long to continue trying (in milliseconds) before timing out. */
    timeToLiveMilliseconds?: number;
}

/**
 * Recursively invokes user-defined `task` until one of the following occurs: `task` succeeds, this function times out,
 * or this function runs out of tries.
 * 
 * @param callerResolve - `resolve` function from caller `Promise`.
 * @param callerReject - `reject` function from caller `Promise`.
 * @param promisifiedTask - Promisified version of user-defined behavior to be tried.
 * @param sleepMillisecondsFunction - How long to sleep (in milliseconds) if the current `task` invocation fails.
 * @param startTimeMilliseconds - Time (in milliseconds since Unix epoch) when recursion started.
 * @param recursionIndex - Zero-indexed recursion counter.
 * @param options - Options.
 * @returns Void.
 */
const tryUntilAsyncHelper = <TTaskResult>(
    callerResolve: (value: TTaskResult | PromiseLike<TTaskResult>) => void,
    callerReject: (reason?: any) => void,
    promisifiedTask: () => Promise<TTaskResult>,
    sleepMillisecondsFunction: (recursionIndex: number) => number,
    startTimeMilliseconds: number,
    recursionIndex: number,
    {
        isVerbose = false,
        remainingNumberOfTries,
        timeToLiveMilliseconds,
    }: ITryUntilAsyncHelperOptions = {},
): void => {
    // Prepare loggers.
    const consoleError = isVerbose ? console.error : () => {};
    const consoleGroup = isVerbose ? console.group : () => {};
    const consoleGroupEnd = isVerbose ? console.groupEnd : () => {};
    // Invoke `promisifiedTask` and handle outcome.
    promisifiedTask().then(
        callerResolve, // `task` succeeded. Stop recursing and resolve caller Promise with `task` result as value.
        (reason) => { // `task` failed (i.e., threw an unhandled exception OR returned a rejected Promise).
            consoleError(`Try #${recursionIndex + 1} failed.`);
            consoleGroup();
            consoleError(reason);
            consoleGroupEnd();
            // If we have run out of time OR will run out of time during the next sleep...
            const sleepMillisecondsNumber: number = sleepMillisecondsFunction(recursionIndex);
            if (typeof timeToLiveMilliseconds === 'number') {
                const remainingMs: number = timeToLiveMilliseconds - (Date.now() - startTimeMilliseconds);
                if (remainingMs <= 0 || remainingMs < sleepMillisecondsNumber) {
                    callerReject('Timed out.'); // ...then reject the caller Promise...
                    return; // ...and stop here (do not recurse).
                }
            }
            // If we have run out of tries...
            if (typeof remainingNumberOfTries === 'number' && remainingNumberOfTries <= 1) {
                callerReject('Ran out of tries.'); // ...then reject the caller Promise...
                return; // ...and stop here (do not recurse).
            }
            // Otherwise...
            sleepAsync(sleepMillisecondsNumber).then( // ...sleep...
                () => {
                    tryUntilAsyncHelper( // ...and recurse.
                        callerResolve,
                        callerReject,
                        promisifiedTask,
                        sleepMillisecondsFunction,
                        startTimeMilliseconds,
                        recursionIndex + 1,
                        {
                            isVerbose,
                            remainingNumberOfTries: typeof remainingNumberOfTries === 'number' ? remainingNumberOfTries - 1 : undefined,
                            timeToLiveMilliseconds,
                        },
                    );
                },
                () => {
                    callerReject('Sleep failed.'); // This should never happen, but if it does then reject the caller Promise and do not recurse.
                },
            );
        },
    );
};

/** `tryUntilAsync` options. */
interface ITryUntilAsyncOptions {
    /** Whether or not to be verbose. */
    isVerbose?: boolean;
    /** How many times to try before giving up. Can be used simultaneously with `timeToLiveMilliseconds`. */
    maximumNumberOfTries?: number;
    /**
     * How long to sleep (in milliseconds) between tries. By default, sleep time starts at 1000 milliseconds and grows
     * exponentially according to the following formula: `1000 * Math.pow(2, recursionIndex)`.
     */
    sleepMilliseconds?: ((recursionIndex: number) => number) | number;
    /**
     * How long to continue trying (in milliseconds) before timing out. Can be used simultaneously with
     * `maximumNumberOfTries`.
     */
    timeToLiveMilliseconds?: number;
}

/**
 * Repeatedly invokes user-defined `task` until one of the following occurs: `task` succeeds, this function times out,
 * or this function runs out of tries. `task` can be either synchronous or asynchronous, but must "fail" or "succeed"
 * according to the following logic:
 * - If `task` is synchronous, then it should "fail" by throwing an unhandled exception, and it should "succeed" by
 *   completing without throwing an unhandled exception.
 * - If `task` is asynchronous via manually returning a `Promise`, then it should "fail" by returning a rejected
 *   `Promise`, and it should "succeed" by returning a resolved `Promise`.
 * - If `task` is asynchronous via the `async` keyword, then it should "fail" by throwing an unhandled exception
 *   (creating a rejected `Promise`), and it should "succeed" by completing without throwing an unhandled exception
 *   (creating a resolved `Promise`).
 * 
 * If `task` cannot "fail", then this function will still work, but it will be completely pointless because `task` will
 * always "succeed" on the first try.
 * 
 * @param task - User-defined behavior to be tried.
 * @param options - Options.
 * @returns Promisified `task` result. Settles when `task` succeeds, this function times out, or this function runs out
 *          of tries.
 */
export const tryUntilAsync = <TTaskResult>(
    task: () => TTaskResult | Promise<TTaskResult>,
    {
        isVerbose = false,
        maximumNumberOfTries,
        sleepMilliseconds = (ri) => 1000 * Math.pow(2, ri),
        timeToLiveMilliseconds,
    }: ITryUntilAsyncOptions = {},
): Promise<TTaskResult> =>
    new Promise((resolve, reject) => {
        tryUntilAsyncHelper(
            resolve,
            reject,
            promisifyByException(task),
            typeof sleepMilliseconds === 'function' ? sleepMilliseconds : () => sleepMilliseconds,
            Date.now(),
            0,
            {
                isVerbose,
                remainingNumberOfTries: maximumNumberOfTries,
                timeToLiveMilliseconds,
            },
        );
    });
