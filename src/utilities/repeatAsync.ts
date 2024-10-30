import { sleepAsync } from './sleepAsync.js';

/** Repetition stops when this signal is returned by `task`. */
const STOP_SIGNAL = 'REPEAT_ASYNC_STOP_SIGNAL';

/**
 * Recursively invokes user-defined `task` until stopped. Repetition stops when `task` returns `STOP_SIGNAL` or
 * `timeToLiveMilliseconds` runs out.
 * 
 * @param callerResolve - `resolve` function from caller `Promise`.
 * @param callerReject - `reject` function from caller `Promise`.
 * @param task - User-defined behavior to be repeated. May return `STOP_SIGNAL` to stop repetition.
 * @param sleepMilliseconds - How long to sleep (in milliseconds) between `task` invocations.
 * @param startTimeMilliseconds - Time (in milliseconds since Unix epoch) when repetition started.
 * @param timeToLiveMilliseconds - How long to continue repeating (in milliseconds) before timing out.
 * @returns Void.
 */
const repeatAsyncHelper = (
    callerResolve: (value: void | PromiseLike<void>) => void,
    callerReject: (reason?: any) => void,
    task: (stopSignal: typeof STOP_SIGNAL) => Promise<typeof STOP_SIGNAL | void> | typeof STOP_SIGNAL | void,
    sleepMilliseconds: number,
    startTimeMilliseconds: number,
    timeToLiveMilliseconds?: number,
): void => {
    const promiseOrScalar = task(STOP_SIGNAL);
    (promiseOrScalar instanceof Promise ? promiseOrScalar : Promise.resolve(promiseOrScalar)).then(
        (scalar) => {
            if (
                scalar === STOP_SIGNAL // user manually stopped
                || (
                    typeof timeToLiveMilliseconds === 'number'
                    && (Date.now() - startTimeMilliseconds) >= timeToLiveMilliseconds // timed out
                )
            ) {
                callerResolve(); // stop recursing
            } else {
                sleepAsync(sleepMilliseconds).then(
                    () => {repeatAsyncHelper(callerResolve, callerReject, task, sleepMilliseconds, startTimeMilliseconds, timeToLiveMilliseconds);}, // recurse
                    () => {callerReject('Sleep failed.');}, // stop recursing
                );
            }
        },
        () => {callerReject('User-defined task failed.');}, // stop recursing
    );
};

/**
 * Repeats user-defined `task` until stopped. Repetition stops when `task` returns `STOP_SIGNAL` or
 * `timeToLiveMilliseconds` runs out. `async`-compatible.
 * 
 * @param task - User-defined behavior to be repeated. May return `STOP_SIGNAL` to stop repetition.
 * @param sleepMilliseconds - How long to sleep (in milliseconds) between `task` invocations.
 * @param timeToLiveMilliseconds - How long to continue repeating (in milliseconds) before timing out.
 * @returns Promisified void. Settles when repetition stops.
 */
export const repeatAsync = (
    task: (stopSignal: typeof STOP_SIGNAL) => Promise<typeof STOP_SIGNAL | void> | typeof STOP_SIGNAL | void,
    sleepMilliseconds: number = 1000,
    timeToLiveMilliseconds?: number,
): Promise<void> =>
    new Promise((resolve, reject) => {
        repeatAsyncHelper(resolve, reject, task, sleepMilliseconds, Date.now(), timeToLiveMilliseconds);
    });
