import { sleepAsync } from './sleepAsync.js';

/** Repetition stops when this signal is returned by `task`. */
export const STOP_SIGNAL = 'REPEAT_ASYNC_STOP_SIGNAL';

/**
 * Recursively invokes user-defined `task` until stopped. Repetition stops when `task`
 * returns `STOP_SIGNAL` or `timeToLiveMilliseconds` runs out.
 * @param {function} task User-defined behavior to be repeated. May return `STOP_SIGNAL` to stop repetition.
 * @param {number} sleepMilliseconds How long to sleep (in milliseconds) between repetitions.
 * @param {number} [timeToLiveMilliseconds] How long to continue repeating (in milliseconds) before timing out.
 * @param {number} startTimeMilliseconds Time (in milliseconds since Unix epoch) since repetition started.
 * @param {function} callerResolve `resolve` function from caller `Promise`.
 * @param {function} callerReject `reject` function from caller `Promise`.
 * @returns {void}
 */
const repeatAsyncHelper = (task, sleepMilliseconds, timeToLiveMilliseconds, startTimeMilliseconds, callerResolve, callerReject) => {
    if (typeof task !== 'function') {
        throw new TypeError('task must have type: function.');
    }
    if (typeof sleepMilliseconds !== 'number') {
        throw new TypeError('sleepMilliseconds must have type: number.');
    }
    if (typeof timeToLiveMilliseconds !== 'number' && typeof timeToLiveMilliseconds !== 'undefined') {
        throw new TypeError('timeToLiveMilliseconds must have type: number, undefined.');
    }
    if (typeof startTimeMilliseconds !== 'number') {
        throw new TypeError('startTimeMilliseconds must have type: number.');
    }
    if (typeof callerResolve !== 'function') {
        throw new TypeError('callerResolve must have type: function.');
    }
    if (typeof callerReject !== 'function') {
        throw new TypeError('callerReject must have type: function.');
    }
    const result = task(STOP_SIGNAL);
    (result instanceof Promise ? result : Promise.resolve(result)).then(
        (signal) => {
            if (
                signal === STOP_SIGNAL // user manually stopped
                || (
                    typeof timeToLiveMilliseconds === 'number'
                    && (Date.now() - startTimeMilliseconds) >= timeToLiveMilliseconds // timed out
                )
            ) {
                callerResolve(); // do not recurse
            } else {
                sleepAsync(sleepMilliseconds).then(
                    () => {repeatAsyncHelper(task, sleepMilliseconds, timeToLiveMilliseconds, startTimeMilliseconds, callerResolve, callerReject);}, // recurse
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
 * @param {function} task User-defined behavior to be repeated. May return `STOP_SIGNAL` to stop repetition.
 * @param {number} [sleepMilliseconds=1000] How long to sleep (in milliseconds) between repetitions.
 * @param {number} [timeToLiveMilliseconds] How long to continue repeating (in milliseconds) before timing out.
 * @returns {Promise} Resolves or rejects when repetition stops.
 */
export const repeatAsync = (task, sleepMilliseconds = 1000, timeToLiveMilliseconds) => {
    if (typeof task !== 'function') {
        throw new TypeError('task must have type: function.');
    }
    if (typeof sleepMilliseconds !== 'number') {
        throw new TypeError('sleepMilliseconds must have type: number.');
    }
    if (typeof timeToLiveMilliseconds !== 'number' && typeof timeToLiveMilliseconds !== 'undefined') {
        throw new TypeError('timeToLiveMilliseconds must have type: number, undefined.');
    }
    return new Promise((resolve, reject) => {
        repeatAsyncHelper(task, sleepMilliseconds, timeToLiveMilliseconds, Date.now(), resolve, reject);
    });
};
