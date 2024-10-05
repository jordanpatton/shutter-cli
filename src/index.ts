import { getCommandLineParameter } from './common/helpers/getCommandLineParameter.js';
import { fetchMoments } from './fetchMoments.js';
import { fetchSkeleton } from './fetchSkeleton.js';
import { logInToShutterflyViaPuppeteer } from './logInToShutterflyViaPuppeteer.js';

/**
 * Downloads photos from Shutterfly.
 * @param parameters - Object with parameters.
 * @returns Promisified void. Settles when workflow is done.
 */
const downloadPhotosFromShutterfly = async ({
    cognitoIdToken: givenCognitoIdToken,
}: {
    /** Identification token from Amazon Cognito authentication service. */
    cognitoIdToken?: string;
}): Promise<void> => {
    console.log('\nAuthenticating...');
    console.group();
    let cognitoIdToken: string;
    if (typeof givenCognitoIdToken === 'string' && givenCognitoIdToken.length) {
        console.log(`Using Cognito idToken from command line:\n${givenCognitoIdToken}`);
        cognitoIdToken = givenCognitoIdToken;
    } else {
        console.log('Logging in to Shutterfly...');
        const puppeteerCognitoIdToken = await logInToShutterflyViaPuppeteer();
        if (typeof puppeteerCognitoIdToken !== 'string' || !puppeteerCognitoIdToken.length) {
            throw new Error('ERROR: Failed to log in to Shutterfly.');
        }
        console.log(`Using Cognito idToken from Shutterfly:\n${puppeteerCognitoIdToken}`);
        cognitoIdToken = puppeteerCognitoIdToken;
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
    console.groupEnd();
    console.log('...done!');

    console.log('\nDownloading photos...');
    console.group();
    console.log(JSON.stringify(moments, null, 4));
    console.groupEnd();
    console.log('...done!');

    return;
};

downloadPhotosFromShutterfly({ cognitoIdToken: getCommandLineParameter('--cognitoIdToken').value });
