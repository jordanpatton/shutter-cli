import { AsyncRepeater } from './helpers.js';

const asyncRepeater = new AsyncRepeater(() => { console.log(Date.now()); });
console.log(asyncRepeater);

asyncRepeater.repeat();
await AsyncRepeater.sleep(5000);
asyncRepeater.stop();
// asyncRepeater.repeat();

await AsyncRepeater.sleep(2000);

asyncRepeater.repeat();
await AsyncRepeater.sleep(5000);
asyncRepeater.stop();

// console.log(Date.now());
// await AsyncRepeater.sleep(2000);
// console.log(Date.now());
