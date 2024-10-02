import { fetchSkeletonViaAPI } from './fetchSkeletonViaAPI.js';
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
    const skeleton = await fetchSkeletonViaAPI(cognitoIdToken);
    console.log(skeleton);
    return;
};

downloadPhotosFromShutterfly();
