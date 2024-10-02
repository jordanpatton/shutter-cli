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
    console.log(skeleton);
    const moments = await fetchPaginatedMomentsViaApi(cognitoIdToken);
    console.log(moments);
    return;
};

downloadPhotosFromShutterfly();
