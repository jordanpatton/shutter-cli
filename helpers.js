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
     * @param {number} milliseconds How long to sleep (in milliseconds).
     * @returns {Promise} Promise that resolves when sleep ends.
     */
    static sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /** Tracks whether or not the instance is currently repeating. */
    #isRepeating = false;
    /** Stores the top-level promise associated with ongoing repeating logic. */
    #repeatPromise;
    /** User-defined function to be repeated. */
    #repeatableFunction;
    /** How long to sleep (in milliseconds) between repetitions. */
    #sleepMilliseconds = 1000;

    /**
     * Returns an instance of `AsyncRepeater`.
     * @param {function} repeatableFunction User-defined function to be repeated.
     * @param {number} [sleepMilliseconds=1000] How long to sleep (in milliseconds) between repetitions.
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
     * @param {function} callerResolve `resolve` function from caller `Promise`.
     * @param {function} callerReject `reject` function from caller `Promise`.
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
     * `await`able. Repeats user-defined logic infinitely until stopped.
     * @returns {Promise} Promise that resolves when repetition stops.
     */
    repeat() {
        // Store a reference to the top-level `Promise` so we can return it from this
        // function and the `stop` function. Doing so allows the user to `await` either
        // of these functions and avoid any race conditions.
        this.#repeatPromise = new Promise((resolve, reject) => {
            if (this.#isRepeating) {
                reject('ERROR: This AsyncRepeater instance is already repeating.');
            } else {
                this.#isRepeating = true;
                this.#repeatHelper(resolve, reject);
            }
        });
        return this.#repeatPromise;
    }

    /**
     * `await`able. Stops infinite repetition of user-defined logic.
     * @returns {Promise} Promise that resolves when repetition stops.
     */
    stop() {
        this.#isRepeating = false;
        return Object.prototype.toString.call(this.#repeatPromise) === '[object Promise]'
            ? this.#repeatPromise
            : Promise.resolve(); // same as: new Promise(resolve => resolve())
    }
}
