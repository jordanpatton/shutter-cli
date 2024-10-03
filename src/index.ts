import { ONE_DAY_IN_MILLISECONDS } from './common/constants.js';
import { fetchPaginatedMomentsViaApi } from './fetchPaginatedMomentsViaApi.js';
import { fetchSkeletonViaApi } from './fetchSkeletonViaApi.js';
import { logInToShutterflyViaPuppeteer } from './logInToShutterflyViaPuppeteer.js';

/**
 * Downloads photos from Shutterfly.
 * @returns Promisified void. Settles when workflow is done.
 */
const downloadPhotosFromShutterfly = async (): Promise<void> => {
    const cognitoIdToken = await logInToShutterflyViaPuppeteer();
    if (typeof cognitoIdToken !== 'string' || !cognitoIdToken.length) {
        console.log('ERROR: Failed to log in to Shutterfly.');
        return;
    }
    const skeleton = await fetchSkeletonViaApi(cognitoIdToken);
    if (!Array.isArray(skeleton) || !skeleton.length) {
        console.log('ERROR: Failed to fetch skeleton.');
        return;
    }
    skeleton.sort((a, b) => (new Date(a.date)).getTime() - (new Date(b.date)).getTime());
    const skeletonEarliest = skeleton[0];
    const startTimeUnixSeconds = Math.max(Math.round(((new Date(skeletonEarliest.date)).getTime() - ONE_DAY_IN_MILLISECONDS) / 1000), 0);
    console.log(`Earliest moment: ${skeletonEarliest.date}.`);
    console.log(`Start time: ${startTimeUnixSeconds} seconds since Unix epoch. (1 day before earliest moment.)`);
    const skeletonLatest = skeleton[skeleton.length - 1];
    const endTimeUnixSeconds = Math.round(((new Date(skeletonLatest.date)).getTime() + ONE_DAY_IN_MILLISECONDS) / 1000);
    console.log(`Latest moment: ${skeletonLatest.date}.`);
    console.log(`End time: ${endTimeUnixSeconds} seconds since Unix epoch. (1 day after latest moment.)`);
    // const moments = await fetchPaginatedMomentsViaApi(cognitoIdToken);
    // console.log(moments);
    return;
};

downloadPhotosFromShutterfly();
