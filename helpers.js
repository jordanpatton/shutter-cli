export const sleep = async milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

/**
 * Repeats some user-defined logic until stopped. This is the `async` equivalent of an
 * infinite recursive loop that uses `setTimeout()` to repeat some work. Each
 * instance of `AsyncRepeater` should only ever be associated with a single
 * `asyncRepeatableFunction`. (Do not reuse instances; instead create more of them.)
 */
export class AsyncRepeater {
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

    /** Sleeps `async` logic for `milliseconds`. */
    static async _sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /** Repeats user-defined logic infinitely until `stop`ped. */
    async repeat() {
        this._isRepeating = true;
        while (this._isRepeating) {
            await this._asyncRepeatableFunction(this);
            if (this._sleepMilliseconds > 0) {
                await AsyncRepeater._sleep(this._sleepMilliseconds);
            }
        }
    }

    /** Stops infinite repetition of user-defined logic. */
    stop() {
        this._isRepeating = false;
    }
}
