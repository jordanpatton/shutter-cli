import { ONE_DAY_IN_MILLISECONDS } from './common/constants.js';
import { fetchPaginatedMomentsViaApi } from './fetchPaginatedMomentsViaApi.js';
import { fetchSkeletonViaApi } from './fetchSkeletonViaApi.js';
import { logInToShutterflyViaPuppeteer } from './logInToShutterflyViaPuppeteer.js';

/**
 * Downloads photos from Shutterfly.
 * @returns Promisified void. Settles when workflow is done.
 */
const downloadPhotosFromShutterfly = async (): Promise<void> => {
    console.log('Logging in to Shutterfly...');
    console.group();
    const cognitoIdToken = await logInToShutterflyViaPuppeteer();
    if (typeof cognitoIdToken !== 'string' || !cognitoIdToken.length) {
        throw new Error('ERROR: Failed to log in to Shutterfly.');
    }
    console.groupEnd();
    console.log('...done!');

    console.log('\nFetching photo library page skeleton...');
    console.group();
    const { momentCount, skeleton } = await fetchSkeletonViaApi(cognitoIdToken);
    if (!Array.isArray(skeleton) || !skeleton.length) {
        throw new Error('ERROR: Malformed skeleton.');
    }
    console.log(`Skeleton contains ${momentCount} moments.`);
    console.groupEnd();
    console.log('...done!');

    console.log('\nCalculating start and end times from skeleton...');
    console.group();
    skeleton.sort((a, b) => (new Date(a.date)).getTime() - (new Date(b.date)).getTime());
    // `skeleton[].date` is a `string` with format YYYY-mm-dd.
    const { date: earliestSkeletonDateString } = skeleton[0];
    const { date: latestSkeletonDateString } = skeleton[skeleton.length - 1];
    console.log(`Skeleton date range: ${earliestSkeletonDateString} to ${latestSkeletonDateString}.`);
    // Start time is 24 hours earlier than `earliestSkeletonDateString`.
    const startTimeUnixSeconds = Math.max(
        Math.round(((new Date(earliestSkeletonDateString)).getTime() - ONE_DAY_IN_MILLISECONDS) / 1000),
        0
    );
    // End time is 24 hours later than `latestSkeletonDateString`.
    const endTimeUnixSeconds = Math.min(
        Math.round(((new Date(latestSkeletonDateString)).getTime() + ONE_DAY_IN_MILLISECONDS) / 1000),
        Number.MAX_SAFE_INTEGER
    );
    console.log(`Calculated time range (Unix seconds): ${startTimeUnixSeconds} to ${endTimeUnixSeconds}.`);
    console.groupEnd();
    console.log('...done!');

    console.log('\nFetching moments...');
    console.group();
    const todo = await fetchPaginatedMomentsViaApi(cognitoIdToken, startTimeUnixSeconds, endTimeUnixSeconds, 2);
    console.log(JSON.stringify(todo, null, 4))
    console.groupEnd();
    console.log('...done!');

    return;
};

downloadPhotosFromShutterfly();
