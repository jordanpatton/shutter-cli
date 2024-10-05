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
    let cognitoIdToken: string;
    if (typeof givenCognitoIdToken === 'string' && givenCognitoIdToken.length) {
        console.log(`Using Cognito idToken from command line:\n${givenCognitoIdToken}`);
        cognitoIdToken = givenCognitoIdToken;
    } else {
        console.log('Logging in to Shutterfly...');
        console.group();
        const puppeteerCognitoIdToken = await logInToShutterflyViaPuppeteer();
        if (typeof puppeteerCognitoIdToken !== 'string' || !puppeteerCognitoIdToken.length) {
            throw new Error('ERROR: Failed to log in to Shutterfly.');
        }
        console.groupEnd();
        console.log('...done!');
        console.log(`Using Cognito idToken from puppeteer:\n${puppeteerCognitoIdToken}`);
        cognitoIdToken = puppeteerCognitoIdToken;
    }

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

/**
 * Parses the command line for a given parameter and returns its value.
 * @param key - Key for a command line parameter.
 * @returns Whether or not the `key` is present and the value associated with that `key`.
 */
const getCommandLineParameter = (key: string) : {
    keyIsPresent: boolean;
    value: string | undefined;
} => {
    // Item 0 is the path to node executable.
    // Item 1 is the path to the entry-point script.
    // Any further items are optional parameters.
    const argvSlice = process.argv.slice(2);
    const keyIndex = argvSlice.indexOf(key);
    return {
        keyIsPresent: keyIndex !== -1,
        value: (keyIndex !== -1 && keyIndex + 1 < argvSlice.length) ? argvSlice[keyIndex + 1] : undefined,
    };
};

downloadPhotosFromShutterfly({ cognitoIdToken: getCommandLineParameter('--cognitoIdToken').value });
