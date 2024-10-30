import { sleepAsync } from './sleepAsync.js';

/**
 * Recursively invokes user-defined `task` until one of the following occurs: `task` succeeds, this function times out,
 * or this function runs out of tries.
 * 
 * @param callerResolve - `resolve` function from caller `Promise`.
 * @param callerReject - `reject` function from caller `Promise`.
 * @param task - User-defined behavior to be tried.
 * @param sleepMilliseconds - How long to sleep (in milliseconds) if the current `task` invocation fails.
 * @param startTimeMilliseconds - Time (in milliseconds since Unix epoch) when recursion started.
 * @param timeToLiveMilliseconds - How long to continue trying (in milliseconds) before timing out.
 * @param remainingNumberOfTries - How many more times to try before giving up.
 * @param recursionIndex - Zero-indexed recursion counter.
 * @param isVerbose - Whether or not to be verbose.
 * @returns Void.
 */
const tryAsyncHelper = <TTaskResult>(
    callerResolve: (value: TTaskResult | PromiseLike<TTaskResult>) => void,
    callerReject: (reason?: any) => void,
    task: () => Promise<TTaskResult> | TTaskResult,
    sleepMilliseconds: ((recursionIndex: number) => number) | number,
    startTimeMilliseconds: number,
    timeToLiveMilliseconds?: number,
    remainingNumberOfTries?: number,
    recursionIndex: number = 0,
    isVerbose: boolean = false,
): void => {
    // Prepare loggers.
    const consoleError = isVerbose ? console.error : () => {};
    const consoleGroup = isVerbose ? console.group : () => {};
    const consoleGroupEnd = isVerbose ? console.groupEnd : () => {};
    // Invoke and promisify `task`.
    // - If `task` is a synchronous function that succeeds, then convert the result into a resolved Promise.
    // - If `task` is a synchronous function that throws, then convert the exception into a rejected Promise.
    // - If `task` is explicitly async or manually returns a Promise, then leave the returned Promise as-is.
    let taskPromise: Promise<TTaskResult>;
    try {
        const taskResult = task();
        taskPromise = taskResult instanceof Promise ? taskResult : Promise.resolve(taskResult);
    } catch (error) {
        taskPromise = Promise.reject(error);
    }
    // Handle promisified task outcome.
    taskPromise.then(
        callerResolve, // `task` succeeded. Stop recursing and resolve caller Promise with `task` result as value.
        (reason) => { // `task` failed (i.e., threw an unhandled exception OR returned a rejected Promise).
            consoleError(`Try #${recursionIndex + 1} failed.`);
            consoleGroup();
            consoleError(reason);
            consoleGroupEnd();
            // If we have run out of time OR will run out of time during the next sleep, then stop recursing.
            // Note: In order to use up 100% of the allotted time (which is cut short when we detect we'll time out
            // during the next sleep), we could sleep for the remaining time before rejecting, but that seems pointless.
            const sleepMillisecondsNumber: number =
                typeof sleepMilliseconds === 'function' ? sleepMilliseconds(recursionIndex) : sleepMilliseconds;
            if (typeof timeToLiveMilliseconds === 'number') {
                const remainingMs: number = timeToLiveMilliseconds - (Date.now() - startTimeMilliseconds);
                if (remainingMs <= 0 || remainingMs < sleepMillisecondsNumber) {
                    callerReject('Timed out.');
                }
            }
            // If we have run out of tries, then stop recursing.
            if (typeof remainingNumberOfTries === 'number' && remainingNumberOfTries <= 1) {
                callerReject('Ran out of tries.');
            }
            // Otherwise, sleep and try again.
            sleepAsync(sleepMillisecondsNumber).then(
                () => {
                    tryAsyncHelper( // Recurse.
                        callerResolve,
                        callerReject,
                        task,
                        sleepMilliseconds,
                        startTimeMilliseconds,
                        timeToLiveMilliseconds,
                        typeof remainingNumberOfTries === 'number' ? remainingNumberOfTries - 1 : undefined,
                        recursionIndex + 1,
                        isVerbose,
                    );
                },
                () => {
                    callerReject('Sleep failed.'); // This should never happen, but if it does then stop recursing.
                },
            );
        },
    );
};

/**
 * Repeatedly invokes user-defined `task` until one of the following occurs: `task` succeeds, this function times out,
 * or this function runs out of tries.
 * 
 * @param task - User-defined behavior to be tried. Can be either synchronous or asynchronous, but must "fail" or
 *        "succeed" according to the following logic. (Note: If `task` cannot "fail", then this function will still
 *        work, but it will be completely pointless because `task` will always "succeed" on the first try.)
 *        - If `task` is synchronous, then it should "fail" by throwing an unhandled exception, and it should "succeed"
 *          by completing without throwing.
 *        - If `task` is asynchronous via manually returning a `Promise`, then it should "fail" by returning a rejected
 *          `Promise`, and it should "succeed" by returning a resolved `Promise`.
 *        - If `task` is asynchronous via the `async` keyword, then it should "fail" by throwing an unhandled exception
 *          (creating a rejected `Promise`), and it should "succeed" by completing without throwing (creating a resolved
 *          `Promise`).
 * @param sleepMilliseconds - How long to sleep (in milliseconds) between tries. By default, sleep time starts at 1000
 *        milliseconds and grows exponentially according to the following formula: `1000 * Math.pow(2, recursionIndex)`.
 * @param timeToLiveMilliseconds - How long to continue trying (in milliseconds) before timing out. Can be used
 *        simultaneously with `maximumNumberOfTries`.
 * @param maximumNumberOfTries - How many times to try before giving up. Can be used simultaneously with
 *        `timeToLiveMilliseconds`.
 * @param isVerbose - Whether or not to be verbose.
 * @returns Promisified task result. Settles when `task` succeeds, this function times out, or this function runs out of
 *          tries.
 */
export const tryAsync = <TTaskResult>(
    task: () => Promise<TTaskResult> | TTaskResult,
    sleepMilliseconds: ((recursionIndex: number) => number) | number = ((ri) => 1000 * Math.pow(2, ri)),
    timeToLiveMilliseconds?: number,
    maximumNumberOfTries?: number,
    isVerbose: boolean = false,
): Promise<TTaskResult> =>
    new Promise((resolve, reject) => {
        tryAsyncHelper(
            resolve,
            reject,
            task,
            sleepMilliseconds,
            Date.now(),
            timeToLiveMilliseconds,
            maximumNumberOfTries,
            0,
            isVerbose,
        );
    });
