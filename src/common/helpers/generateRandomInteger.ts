/**
 * Generates a random integer between `minimum` and `maximum`.
 * 
 * @see https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 */
export const generateRandomInteger = (minimum: number = 0, maximum: number = 1): number =>
    Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
