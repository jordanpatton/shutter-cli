import { existsSync } from 'node:fs';

import { getCommandLineParameter } from '../../utilities/getCommandLineParameter.js';
import { downloadAssetsSerial } from './components/downloadAssetsSerial.js';
import { fetchMoments } from './components/fetchMoments.js';
import { fetchSkeleton } from './components/fetchSkeleton.js';
import { logIn } from './components/logIn.js';

/** `downloadAssets` parameters. */
interface IDownloadAssetsParameters {
    /** Identification token from Amazon Cognito authentication service. */
    cognitoIdToken?: string;
    /** Fixed delay between downloads in integer milliseconds. */
    downloadDelayFixedMilliseconds?: number;
    /** Jittered delay between downloads in integer milliseconds. */
    downloadDelayJitterMilliseconds?: number;
    /** Destination directory for downloaded assets. */
    downloadToDirectory?: string;
    /** End of time range in seconds since Unix epoch. */
    endTimeUnixSeconds?: number;
    /** Start of time range in seconds since Unix epoch. */
    startTimeUnixSeconds?: number;
}

/**
 * Parses `downloadAssets` parameters.
 * 
 * @returns Parsed parameters.
 * 
 * @see https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
 * @see https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
 */
export const parseDownloadAssetsParameters = (): IDownloadAssetsParameters => {
    const parsed: IDownloadAssetsParameters = {};
    // cognito-id-token (optional): non-empty string
    const cognitoIdToken = getCommandLineParameter('--cognito-id-token').value;
    if (typeof cognitoIdToken === 'string') {
        if (cognitoIdToken.length) {
            parsed.cognitoIdToken = cognitoIdToken;
            console.log('Parsed cognito-id-token from command line.');
        } else {
            throw new TypeError('cognito-id-token (optional) must be a non-empty string.');
        }
    }
    // download-delay-fixed-milliseconds (optional): positive integer
    const downloadDelayFixedMilliseconds = getCommandLineParameter('--download-delay-fixed-milliseconds').value;
    if (typeof downloadDelayFixedMilliseconds === 'string') {
        const f = parseFloat(downloadDelayFixedMilliseconds);
        if (!isNaN(f) && Number.isInteger(f) && f >= 0) {
            parsed.downloadDelayFixedMilliseconds = f;
            console.log('Parsed download-delay-fixed-milliseconds from command line.');
        } else {
            throw new TypeError('download-delay-fixed-milliseconds (optional) must be a positive integer.');
        }
    }
    // download-delay-jitter-milliseconds (optional): positive integer
    const downloadDelayJitterMilliseconds = getCommandLineParameter('--download-delay-jitter-milliseconds').value;
    if (typeof downloadDelayJitterMilliseconds === 'string') {
        const f = parseFloat(downloadDelayJitterMilliseconds);
        if (!isNaN(f) && Number.isInteger(f) && f >= 0) {
            parsed.downloadDelayJitterMilliseconds = f;
            console.log('Parsed download-delay-jitter-milliseconds from command line.');
        } else {
            throw new TypeError('download-delay-jitter-milliseconds (optional) must be a positive integer.');
        }
    }
    // download-to-directory (optional): existing directory
    const downloadToDirectory = getCommandLineParameter('--download-to-directory').value;
    if (typeof downloadToDirectory === 'string') {
        // TODO: Check that the path points to a directory (not a file).
        if (existsSync(downloadToDirectory)) {
            parsed.downloadToDirectory = downloadToDirectory;
            console.log('Parsed download-to-directory from command line.');
        } else {
            throw new TypeError('download-to-directory (optional) must be an existing directory.');
        }
    }
    // end-time (optional): new-Date-able expression
    const endTime = getCommandLineParameter('--end-time').value;
    if (typeof endTime === 'string') {
        const d = new Date(endTime);
        if (!isNaN(d.getTime())) {
            parsed.endTimeUnixSeconds = Math.round(d.getTime() / 1000);
            console.log('Parsed end-time from command line.');
        } else {
            throw new TypeError('end-time (optional) must be a valid date/time expression.');
        }
    }
    // start-time (optional): new-Date-able expression
    const startTime = getCommandLineParameter('--start-time').value;
    if (typeof startTime === 'string') {
        const d = new Date(startTime);
        if (!isNaN(d.getTime())) {
            parsed.startTimeUnixSeconds = Math.round(d.getTime() / 1000);
            console.log('Parsed start-time from command line.');
        } else {
            throw new TypeError('start-time (optional) must be a valid date/time expression.');
        }
    }
    return parsed;
};

/**
 * Downloads assets from Shutterfly.
 * 
 * @param parameters - Parameters.
 * @returns Promisified void. Settles when workflow is done.
 */
export const downloadAssets = async ({
    cognitoIdToken: givenCognitoIdToken,
    downloadDelayFixedMilliseconds,
    downloadDelayJitterMilliseconds,
    downloadToDirectory,
    endTimeUnixSeconds: givenEndTimeUnixSeconds,
    startTimeUnixSeconds: givenStartTimeUnixSeconds,
}: IDownloadAssetsParameters): Promise<void> => {
    console.log('\nAuthenticating...');
    console.group();
    let cognitoIdToken: string;
    if (typeof givenCognitoIdToken === 'string') {
        cognitoIdToken = givenCognitoIdToken;
        console.log('Skipping Shutterfly login and using given Cognito idToken.');
    } else {
        console.log('Logging in to Shutterfly...');
        const newCognitoIdToken = await logIn();
        if (typeof newCognitoIdToken === 'string' && newCognitoIdToken.length) {
            cognitoIdToken = newCognitoIdToken;
            console.log(`Using Cognito idToken from Shutterfly:\n${newCognitoIdToken}`);
        } else {
            throw new Error('Failed to log in to Shutterfly.');
        }
    }
    console.groupEnd();
    console.log('...done!');

    console.log('\nDetermining time range...');
    console.group();
    let startTimeUnixSeconds: number;
    let endTimeUnixSeconds: number;
    if (typeof givenStartTimeUnixSeconds === 'number' && typeof givenEndTimeUnixSeconds === 'number') {
        startTimeUnixSeconds = givenStartTimeUnixSeconds;
        endTimeUnixSeconds = givenEndTimeUnixSeconds;
        console.log('Skipping skeleton and using given time range.');
    } else {
        console.log('Fetching skeleton...');
        const o = await fetchSkeleton(cognitoIdToken);
        if (typeof o === 'undefined') {
            console.log('Terminating due to empty skeleton.');
            return;
        } else {
            if (typeof givenStartTimeUnixSeconds === 'number') {
                startTimeUnixSeconds = givenStartTimeUnixSeconds;
                console.log('Using given start time.');
            } else {
                startTimeUnixSeconds = o.startTimeUnixSeconds;
                console.log(`Using skeleton start time: ${startTimeUnixSeconds} (${o.earliestDateString} minus 1 day).`);
            }
            if (typeof givenEndTimeUnixSeconds === 'number') {
                endTimeUnixSeconds = givenEndTimeUnixSeconds;
                console.log('Using given end time.');
            } else {
                endTimeUnixSeconds = o.endTimeUnixSeconds;
                console.log(`Using skeleton end time: ${endTimeUnixSeconds} (${o.latestDateString} plus 1 day).`);
            }
        }
    }
    console.groupEnd();
    console.log('...done!');

    console.log('\nBuilding list of downloadable assets...');
    console.group();
    const moments = await fetchMoments(cognitoIdToken, startTimeUnixSeconds, endTimeUnixSeconds);
    console.groupEnd();
    console.log('...done!');

    console.log(`\nDownloading ${moments.length} assets...`);
    console.group();
    await downloadAssetsSerial(
        cognitoIdToken,
        moments,
        downloadToDirectory,
        downloadDelayFixedMilliseconds,
        downloadDelayJitterMilliseconds
    );
    console.groupEnd();
    console.log('...done!');

    return;
};
