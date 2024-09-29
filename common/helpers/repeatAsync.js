import { sleepAsync } from './sleepAsync.js';

/** Repetition stops when this signal is returned by `taskFunction`. */
export const STOP_SIGNAL = 'REPEAT_ASYNC_STOP_SIGNAL';

/**
 * Recursively invokes user-defined `taskFunction` until stopped. Repetition stops when
 * `taskFunction` returns `STOP_SIGNAL`.
 * @param {function} taskFunction User-defined task to be repeated. Must return `STOP_SIGNAL` when repetition should stop.
 * @param {number} sleepMilliseconds How long to sleep (in milliseconds) between repetitions.
 * @param {function} callerResolve `resolve` function from caller `Promise`.
 * @param {function} callerReject `reject` function from caller `Promise`.
 * @returns {void}
 */
const repeatAsyncHelper = (taskFunction, sleepMilliseconds, callerResolve, callerReject) => {
    if (typeof taskFunction !== 'function') {
        throw new TypeError('taskFunction must have type: function.');
    }
    if (typeof sleepMilliseconds !== 'number') {
        throw new TypeError('sleepMilliseconds must have type: number.');
    }
    if (typeof callerResolve !== 'function') {
        throw new TypeError('callerResolve must have type: function.');
    }
    if (typeof callerReject !== 'function') {
        throw new TypeError('callerReject must have type: function.');
    }
    const result = taskFunction(STOP_SIGNAL);
    (result instanceof Promise ? result : Promise.resolve(result)).then(
        (signal) => {
            if (signal === STOP_SIGNAL) {
                callerResolve(); // do not recurse
            } else {
                sleepAsync(sleepMilliseconds).then(
                    () => {repeatAsyncHelper(taskFunction, sleepMilliseconds, callerResolve, callerReject);}, // recurse
                    () => {callerReject('ERROR: Sleep failed.');},
                );
            }
        },
        () => {callerReject('ERROR: User-defined task failed.');},
    );
};

/**
 * Repeats user-defined `taskFunction` until stopped. Repetition stops when `taskFunction`
 * returns `STOP_SIGNAL`. `async`-compatible.
 * @param {function} taskFunction User-defined task to be repeated. Must return `STOP_SIGNAL` when repetition should stop.
 * @param {number} [sleepMilliseconds=1000] How long to sleep (in milliseconds) between repetitions.
 * @returns {Promise} Resolves or rejects when repetition stops.
 */
export const repeatAsync = (taskFunction, sleepMilliseconds = 1000) => {
    if (typeof taskFunction !== 'function') {
        throw new TypeError('taskFunction must have type: function.');
    }
    if (typeof sleepMilliseconds !== 'number') {
        throw new TypeError('sleepMilliseconds must have type: number.');
    }
    return new Promise((resolve, reject) => {
        repeatAsyncHelper(taskFunction, sleepMilliseconds, resolve, reject);
    });
};
