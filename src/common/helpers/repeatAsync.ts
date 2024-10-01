import { sleepAsync } from './sleepAsync.js';

/** Repetition stops when this signal is returned by `task`. */
export const STOP_SIGNAL = 'REPEAT_ASYNC_STOP_SIGNAL';

/**
 * Recursively invokes user-defined `task` until stopped. Repetition stops when `task`
 * returns `STOP_SIGNAL` or `timeToLiveMilliseconds` runs out.
 * @returns {void}
 */
const repeatAsyncHelper = (
    /** `resolve` function from caller `Promise`. */
    callerResolve: (value: void | PromiseLike<void>) => void,
    /** `reject` function from caller `Promise`. */
    callerReject: (reason?: any) => void,
    /** User-defined behavior to be repeated. May return `STOP_SIGNAL` to stop repetition. */
    task: (stopSignal: typeof STOP_SIGNAL) => Promise<typeof STOP_SIGNAL | void> | typeof STOP_SIGNAL | void,
    /** How long to sleep (in milliseconds) between `task` invocations. */
    sleepMilliseconds: number,
    /** Time (in milliseconds since Unix epoch) since repetition started. */
    startTimeMilliseconds: number,
    /** How long to continue repeating (in milliseconds) before timing out. */
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
                callerResolve(); // do not recurse
            } else {
                sleepAsync(sleepMilliseconds).then(
                    () => {repeatAsyncHelper(callerResolve, callerReject, task, sleepMilliseconds, startTimeMilliseconds, timeToLiveMilliseconds);}, // recurse
                    () => {callerReject('ERROR: Sleep failed.');},
                );
            }
        },
        () => {callerReject('ERROR: User-defined task failed.');},
    );
};

/**
 * Repeats user-defined `task` until stopped. Repetition stops when `task` returns
 * `STOP_SIGNAL` or `timeToLiveMilliseconds` runs out. `async`-compatible.
 * @returns {Promise} Resolves or rejects when repetition stops.
 */
export const repeatAsync = (
    /** User-defined behavior to be repeated. May return `STOP_SIGNAL` to stop repetition. */
    task: (stopSignal: typeof STOP_SIGNAL) => Promise<typeof STOP_SIGNAL | void> | typeof STOP_SIGNAL | void,
    /** How long to sleep (in milliseconds) between `task` invocations. */
    sleepMilliseconds: number = 1000,
    /** How long to continue repeating (in milliseconds) before timing out. */
    timeToLiveMilliseconds?: number,
): Promise<void> => (
    new Promise((resolve, reject) => {
        repeatAsyncHelper(resolve, reject, task, sleepMilliseconds, Date.now(), timeToLiveMilliseconds);
    })
);
