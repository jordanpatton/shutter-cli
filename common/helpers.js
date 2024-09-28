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

/**
 * Recursively invokes user-defined `taskFunction` until stopped. The continue/stop signal
 * comes from `taskFunction`'s return value.
 * @param {function} taskFunction User-defined task to be repeated. If `taskFunction` returns `false`, then repetition will stop. If `taskFunction` returns `true`, then repetition will continue.
 * @param {function} sleepMilliseconds How long to sleep (in milliseconds) between repetitions.
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
    const result = taskFunction();
    (result instanceof Promise ? result : Promise.resolve(result)).then(
        (shouldContinue = false) => {
            if (typeof shouldContinue !== 'boolean') {
                throw new TypeError('shouldContinue must have type: boolean.');
            }
            if (shouldContinue) {
                sleepAsync(sleepMilliseconds).then(
                    () => {repeatAsyncHelper(taskFunction, sleepMilliseconds, callerResolve, callerReject);}, // recurse
                    () => {callerReject('ERROR: Sleep failed.');},
                );
            } else {
                callerResolve(); // instead of recursing, just invoke caller's resolve()
            }
        },
        () => {callerReject('ERROR: User-defined task failed.');},
    );
};

/**
 * Repeats user-defined `taskFunction` until stopped. This is an `async`-compatible
 * infinite recursion loop. The continue/stop signal comes `taskFunction`'s return value.
 * @param {function} taskFunction User-defined task to be repeated. If `taskFunction` returns `false`, then repetition will stop. If `taskFunction` returns `true`, then repetition will continue.
 * @param {function} sleepMilliseconds How long to sleep (in milliseconds) between repetitions.
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
