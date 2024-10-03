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
        console.log('ERROR: Failed to log in to Shutterfly.');
        return;
    }
    console.groupEnd();
    console.log('...done!');

    console.log('\nFetching photo library page skeleton...');
    console.group();
    const skeleton = await fetchSkeletonViaApi(cognitoIdToken);
    if (!Array.isArray(skeleton) || !skeleton.length) {
        console.log('ERROR: Failed to fetch skeleton.');
        return;
    }
    console.groupEnd();
    console.log('...done!');

    console.log('\nCalculating start and end times from skeleton...');
    console.group();
    skeleton.sort((a, b) => (new Date(a.date)).getTime() - (new Date(b.date)).getTime());
    // `skeleton[...].date` is a `string` with format YYYY-mm-dd.
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
    console.log(`Calculated time range (epoch seconds): ${startTimeUnixSeconds} to ${endTimeUnixSeconds}.`);
    console.groupEnd();
    console.log('...done!');

    console.log('\nFetching moments...');
    console.group();
    // const moments = await fetchPaginatedMomentsViaApi(cognitoIdToken);
    // console.log(moments);
    console.groupEnd();
    console.log('...done!');

    return;
};

downloadPhotosFromShutterfly();
