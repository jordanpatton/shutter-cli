const DEFAULT_SHOULD_AUTOSTART = false;
const DEFAULT_SLEEP_MILLISECONDS = 1000;

/**
 * Repeats some user-defined task until stopped. This is an `async`-compatible equivalent
 * of an infinite recursive loop that uses `setTimeout()` to repeat some work. Each
 * instance of `AsyncRepeater` should only ever be associated with a single
 * `taskFunction`. (DO NOT reuse instances. Instead, create more of them.)
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

    /** Whether or not this instance is currently repeating. */
    #isRepeating = false;
    /** Top-level promise associated with ongoing repetition. */
    #masterPromise;
    /** How long to sleep (in milliseconds) between repetitions. */
    #sleepMilliseconds = DEFAULT_SLEEP_MILLISECONDS;
    /** User-defined task to be repeated. */
    #taskFunction;

    /**
     * Returns an instance of `AsyncRepeater`.
     * @param {function} taskFunction User-defined task to be repeated.
     * @param {number} [sleepMilliseconds=DEFAULT_SLEEP_MILLISECONDS] How long to sleep (in milliseconds) between repetitions.
     * @param {boolean} [shouldAutostart=DEFAULT_SHOULD_AUTOSTART] Whether or not to automatically start repeating.
     * @returns {AsyncRepeater} Instance of `AsyncRepeater`.
     */
    constructor(
        taskFunction,
        sleepMilliseconds = DEFAULT_SLEEP_MILLISECONDS,
        shouldAutostart = DEFAULT_SHOULD_AUTOSTART,
    ) {
        if (typeof taskFunction !== 'function') {
            throw new TypeError('taskFunction must have type: function.');
        }
        if (typeof sleepMilliseconds !== 'number') {
            throw new TypeError('sleepMilliseconds must have type: number.');
        }
        if (typeof shouldAutostart !== 'boolean') {
            throw new TypeError('shouldAutostart must have type: boolean.');
        }
        this.#taskFunction = taskFunction;
        this.#sleepMilliseconds = sleepMilliseconds;
        if (shouldAutostart) {
            this.start();
        }
    }

    /**
     * Recursively invokes user-defined task until stopped.
     * @param {function} callerResolve `resolve` function from caller `Promise`.
     * @param {function} callerReject `reject` function from caller `Promise`.
     * @returns {void}
     */
    #startHelper(callerResolve, callerReject) {
        if (this.#isRepeating) {
            const result = this.#taskFunction();
            (result instanceof Promise ? result : Promise.resolve(result)).then(
                () => {
                    AsyncRepeater.sleep(this.#sleepMilliseconds).then(
                        () => { this.#startHelper(callerResolve, callerReject); }, // recurse
                        () => { callerReject('ERROR: Sleep failed.'); },
                    );
                },
                () => { callerReject('ERROR: User-defined task failed.'); },
            );
        } else {
            callerResolve();
        }
    }

    /**
     * `await`able. Starts repeating user-defined task infinitely until stopped.
     * @returns {Promise} Promise that resolves when repetition stops.
     */
    start() {
        // Store a reference to the top-level `Promise` so we can return it from this
        // function and the `stop` function. Doing so allows the user to `await` either
        // of these functions and avoid any race conditions.
        this.#masterPromise = new Promise((resolve, reject) => {
            if (this.#isRepeating) {
                reject('ERROR: This instance is already repeating.');
            } else {
                this.#isRepeating = true;
                this.#startHelper(resolve, reject);
            }
        });
        return this.#masterPromise;
    }

    /**
     * `await`able. Stops infinite repetition of user-defined task. WARNING: Incorrect
     * use of this function creates a race condition. DO NOT do this:
     * ```javascript
     * const asyncRepeater = new AsyncRepeater(...);
     * asyncRepeater.start();
     * asyncRepeater.stop(); // BAD! May not finish before next line.
     * asyncRepeater.start();
     * ```
     * Instead, `await` the `stop()` method before invoking `start()` again...
     * ```javascript
     * const asyncRepeater = new AsyncRepeater(...);
     * asyncRepeater.start();
     * await asyncRepeater.stop(); // GOOD!
     * asyncRepeater.start();
     * ```
     * ...or use the `Promise`-based equivalent:
     * ```javascript
     * const asyncRepeater = new AsyncRepeater(...);
     * asyncRepeater.start();
     * asyncRepeater.stop().then(() => {asyncRepeater.start();}); // GOOD!
     * ```
     * @returns {Promise} Promise that resolves when repetition stops.
     */
    stop() {
        this.#isRepeating = false; // will cause `#startHelper` to stop recursing
        return this.#masterPromise instanceof Promise ? this.#masterPromise : Promise.resolve();
    }
}
