/**
 * Repeats some user-defined logic until stopped. This is an `async`-compatible equivalent
 * of an infinite recursive loop that uses `setTimeout()` to repeat some work. Each
 * instance of `AsyncRepeater` should only ever be associated with a single
 * `repeatableFunction`. (Do not reuse instances; instead create more of them.)
 */
export class AsyncRepeater {
    /**
     * Promise-based sleep that suspends logic flow for `milliseconds`.
     * ```javascript
     * doSomethingBeforeSleep();
     * await AsyncRepeater.sleep(1000);
     * doSomethingAfterSleep();
     * ```
     * @param {number} milliseconds TODO.
     * @returns {Promise} Promise that resolves when sleep ends.
     */
    static sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    #isRepeating = false;
    #repeatableFunction;
    #sleepMilliseconds = 1000;

    /**
     * TODO.
     * @param {function} repeatableFunction TODO.
     * @param {number} [sleepMilliseconds=1000] TODO.
     * @returns {object} Instance of `AsyncRepeater`.
     */
    constructor(repeatableFunction, sleepMilliseconds = 1000) {
        if (typeof repeatableFunction !== 'function') {
            throw new TypeError('repeatableFunction must have type: function.');
        }
        if (typeof sleepMilliseconds !== 'number') {
            throw new TypeError('sleepMilliseconds must have type: number.');
        }
        this.#repeatableFunction = repeatableFunction;
        this.#sleepMilliseconds = sleepMilliseconds;
    }

    /**
     * Recursively invokes user-defined logic until stopped.
     * @param {function} callerResolve TODO.
     * @param {function} callerReject TODO.
     * @returns {void}
     */
    #repeatHelper(callerResolve, callerReject) {
        if (this.#isRepeating) {
            const result = this.#repeatableFunction();
            const resultPromise = Object.prototype.toString.call(result) === '[object Promise]'
                ? result
                : Promise.resolve(result); // same as: new Promise(resolve => resolve(result))
            resultPromise.then(
                () => {
                    AsyncRepeater.sleep(this.#sleepMilliseconds).then(
                        () => { this.#repeatHelper(callerResolve, callerReject); }, // recurse
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
            if (this.#isRepeating) {
                reject('ERROR: This AsyncRepeater instance is already repeating.');
            } else {
                this.#isRepeating = true;
                this.#repeatHelper(resolve, reject);
            }
        });
    }

    /**
     * Stops infinite repetition of user-defined logic.
     * @returns {void}
     */
    stop() {
        this.#isRepeating = false;
    }
}
