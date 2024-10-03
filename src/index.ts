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
    // TODO: sort skeleton by date, extract min/max, add/subtract 1 day, convert to seconds, pass to fetchPaginatedMomentsViaApi
    console.log(skeleton);
    // const moments = await fetchPaginatedMomentsViaApi(cognitoIdToken);
    // console.log(moments);
    return;
};

downloadPhotosFromShutterfly();
