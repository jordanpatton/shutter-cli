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
    endTime: givenEndTime,
    startTime: givenStartTime,
}: {
    /** Identification token from Amazon Cognito authentication service. */
    cognitoIdToken?: string;
    /** End of time range. Must be parsable by `new Date()`. */
    endTime?: string;
    /** Start of time range. Must be parsable by `new Date()`. */
    startTime?: string;
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
    let startTimeUnixSeconds: number | undefined;
    let endTimeUnixSeconds: number | undefined;
    if (typeof givenStartTime === 'string' && givenStartTime.length) {
        startTimeUnixSeconds = Math.round((new Date(givenStartTime)).getTime() / 1000);
        console.log(`Using start time from command line: ${givenStartTime} (${startTimeUnixSeconds})`);
    }
    if (typeof givenEndTime === 'string' && givenEndTime.length) {
        endTimeUnixSeconds = Math.round((new Date(givenEndTime)).getTime() / 1000);
        console.log(`Using end time from command line: ${givenEndTime} (${endTimeUnixSeconds})`);
    }
    if (typeof startTimeUnixSeconds !== 'number' || typeof endTimeUnixSeconds !== 'number') {
        console.log('Fetching skeleton...');
        const o = await fetchSkeleton(cognitoIdToken);
        if (typeof startTimeUnixSeconds !== 'number') {
            startTimeUnixSeconds = o.startTimeUnixSeconds;
            console.log(`Using start time from skeleton: ${o.earliestDateString} minus 1 day (${startTimeUnixSeconds})`);
        }
        if (typeof endTimeUnixSeconds !== 'number') {
            endTimeUnixSeconds = o.endTimeUnixSeconds;
            console.log(`Using end time from skeleton: ${o.latestDateString} plus 1 day (${endTimeUnixSeconds})`);
        }
    }
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

downloadPhotosFromShutterfly({
    cognitoIdToken: getCommandLineParameter('--cognitoIdToken').value,
    endTime: getCommandLineParameter('--endTime').value,
    startTime: getCommandLineParameter('--startTime').value,
});
