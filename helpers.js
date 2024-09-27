/**
 * Repeats some user-defined logic until stopped. This is an `async`-compatible equivalent
 * of an infinite recursive loop that uses `setTimeout()` to repeat some work. Each
 * instance of `AsyncRepeater` should only ever be associated with a single
 * `asyncRepeatableFunction`. (Do not reuse instances; instead create more of them.)
 */
export class AsyncRepeater {
    /**
     * TODO.
     * @param {function} asyncRepeatableFunction TODO.
     * @param {number} [sleepMilliseconds=1000] TODO.
     * @returns {object} Instance of `AsyncRepeater`.
     */
    constructor(asyncRepeatableFunction, sleepMilliseconds = 1000) {
        if (typeof asyncRepeatableFunction !== 'function') {
            throw new TypeError('asyncRepeatableFunction must have type: function.');
        }
        if (typeof sleepMilliseconds !== 'number') {
            throw new TypeError('sleepMilliseconds must have type: number.');
        }
        this._asyncRepeatableFunction = asyncRepeatableFunction;
        this._isRepeating = false;
        this._sleepMilliseconds = sleepMilliseconds;
    }

    /**
     * Sleeps `async` logic for `milliseconds`.
     * @param {number} milliseconds TODO.
     * @returns {Promise} Promise that resolves when sleep ends.
     */
    static _sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /**
     * Recursively invokes user-defined logic until stopped.
     * @param {function} callerResolve TODO.
     * @param {function} callerReject TODO.
     * @returns {void}
     */
    _repeatHelper(callerResolve, callerReject) {
        if (this._isRepeating) {
            const result = this._asyncRepeatableFunction();
            const resultPromise = Object.prototype.toString.call(result) === '[object Promise]'
                ? result
                : Promise.resolve(result); // same as: new Promise(resolve => resolve(result))
            resultPromise.then(
                () => {
                    AsyncRepeater._sleep(this._sleepMilliseconds).then(
                        () => { this._repeatHelper(callerResolve, callerReject); }, // recurse
                        () => { callerReject('ERROR: Sleep failed.'); },
                    );
                },
                () => { callerReject('ERROR: User-defined logic failed.'); },
            );
        } else {
            callerResolve();
        }
    }

    /**
     * Repeats user-defined logic infinitely until stopped.
     * @returns {Promise} Promise that resolves when the repetition stops.
     */
    repeat() {
        return new Promise((resolve, reject) => {
            if (this._isRepeating) {
                reject('ERROR: This AsyncRepeater instance is already repeating.');
            } else {
                this._isRepeating = true;
                this._repeatHelper(resolve, reject);
            }
        });
    }

    /**
     * Stops infinite repetition of user-defined logic.
     * @returns {void}
     */
    stop() {
        this._isRepeating = false;
    }
}
