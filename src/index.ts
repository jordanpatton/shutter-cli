import { fetchMoments } from './fetchMoments.js';
import { fetchSkeleton } from './fetchSkeleton.js';
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

    console.log('\nDetermining time range...');
    console.group();
    const { endTimeUnixSeconds, startTimeUnixSeconds } = await fetchSkeleton(cognitoIdToken);
    console.groupEnd();
    console.log('...done!');

    console.log('\nBuilding list of downloadable photos...');
    console.group();
    const moments = await fetchMoments(cognitoIdToken, startTimeUnixSeconds, endTimeUnixSeconds);
    console.log(JSON.stringify(moments, null, 4))
    console.groupEnd();
    console.log('...done!');

    return;
};

downloadPhotosFromShutterfly();
