/**
 * Returns a wrapped version of the input function that will return a `Promise`. (Does not invoke the input function.)
 * When you eventually invoke the wrapped function, it will behave as follows:
 * - If the input function is synchronous and it does not throw an unhandled exception, then the `Promise` will resolve.
 * - If the input function is synchronous and it throws an unhandled exception, then the `Promise` will reject.
 * - If the input function is asynchronous (by way of `async` keyword or by manually returning a `Promise`), then
 *   `promisifyByException` changes nothing and simply returns the natural result of the input function.
 * 
 * @param fn - Input function to be wrapped.
 * @returns Promisified version of the input function.
 * 
 * @see https://stackoverflow.com/questions/38598280/is-it-possible-to-wrap-a-function-and-retain-its-types
 */
export const promisifyByException = <TArguments extends Array<unknown>, TResult>(
    fn: (...args: TArguments) => TResult | Promise<TResult>,
): (...args: TArguments) => Promise<TResult> => {
    return (...args: TArguments) => {
        try {
            const result = fn(...args);
            return result instanceof Promise ? result : Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    };
};
