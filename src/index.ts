import { THISLIFE_DOWNLOAD_URL } from './common/constants.js';
import { DEFAULT_FILE_NAME, downloadAsync } from './common/helpers/downloadAsync.js';
import { generateRandomInteger } from './common/helpers/generateRandomInteger.js';
import { getCommandLineParameter } from './common/helpers/getCommandLineParameter.js';
import { getFileNameParts } from './common/helpers/getFileNameParts.js';
import { sleepAsync } from './common/helpers/sleepAsync.js';
import { fetchMoments } from './fetchMoments.js';
import { fetchSkeleton } from './fetchSkeleton.js';
import { logInToShutterflyViaPuppeteer } from './logInToShutterflyViaPuppeteer.js';

/** `downloadPhotosFromShutterfly` parameters. */
interface IDownloadPhotosFromShutterflyParameters {
    /** Identification token from Amazon Cognito authentication service. */
    cognitoIdToken?: string;
    /** Fixed delay between downloads in integer milliseconds. */
    downloadDelayFixedMilliseconds?: number;
    /** Jittered delay between downloads in integer milliseconds. */
    downloadDelayJitterMilliseconds?: number;
    /** End of time range in seconds since Unix epoch. */
    endTimeUnixSeconds?: number;
    /** Start of time range in seconds since Unix epoch. */
    startTimeUnixSeconds?: number;
}

/**
 * Parses `downloadPhotosFromShutterfly` parameters.
 * 
 * @returns Parsed parameters.
 * 
 * @see https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
 * @see https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
 */
const parseDownloadPhotosFromShutterflyParameters = (): IDownloadPhotosFromShutterflyParameters => {
    const parsed: IDownloadPhotosFromShutterflyParameters = {};
    // cognitoIdToken (optional): non-empty string
    const cognitoIdToken = getCommandLineParameter('--cognitoIdToken').value;
    if (typeof cognitoIdToken === 'string') {
        if (cognitoIdToken.length) {
            parsed.cognitoIdToken = cognitoIdToken;
            console.log('Parsed cognitoIdToken from command line.');
        } else {
            throw new TypeError('cognitoIdToken (optional) must be a non-empty string.');
        }
    }
    // downloadDelayFixedMilliseconds (optional): positive integer
    const downloadDelayFixedMilliseconds = getCommandLineParameter('--downloadDelayFixedMilliseconds').value;
    if (typeof downloadDelayFixedMilliseconds === 'string') {
        const f = parseFloat(downloadDelayFixedMilliseconds);
        if (!isNaN(f) && Number.isInteger(f) && f >= 0) {
            parsed.downloadDelayFixedMilliseconds = f;
            console.log('Parsed downloadDelayFixedMilliseconds from command line.');
        } else {
            throw new TypeError('downloadDelayFixedMilliseconds (optional) must be a positive integer.');
        }
    }
    // downloadDelayJitterMilliseconds (optional): positive integer
    const downloadDelayJitterMilliseconds = getCommandLineParameter('--downloadDelayJitterMilliseconds').value;
    if (typeof downloadDelayJitterMilliseconds === 'string') {
        const f = parseFloat(downloadDelayJitterMilliseconds);
        if (!isNaN(f) && Number.isInteger(f) && f >= 0) {
            parsed.downloadDelayJitterMilliseconds = f;
            console.log('Parsed downloadDelayJitterMilliseconds from command line.');
        } else {
            throw new TypeError('downloadDelayJitterMilliseconds (optional) must be a positive integer.');
        }
    }
    // endTime (optional): new-Date-able expression
    const endTime = getCommandLineParameter('--endTime').value;
    if (typeof endTime === 'string') {
        const d = new Date(endTime);
        if (!isNaN(d.getTime())) {
            parsed.endTimeUnixSeconds = Math.round(d.getTime() / 1000);
            console.log('Parsed endTime from command line.');
        } else {
            throw new TypeError('endTime (optional) must be a valid date/time expression.');
        }
    }
    // startTime (optional): new-Date-able expression
    const startTime = getCommandLineParameter('--startTime').value;
    if (typeof startTime === 'string') {
        const d = new Date(startTime);
        if (!isNaN(d.getTime())) {
            parsed.startTimeUnixSeconds = Math.round(d.getTime() / 1000);
            console.log('Parsed startTime from command line.');
        } else {
            throw new TypeError('startTime (optional) must be a valid date/time expression.');
        }
    }
    return parsed;
};

/**
 * Downloads photos from Shutterfly.
 * 
 * @param parameters - Parameters.
 * @returns Promisified void. Settles when workflow is done.
 */
const downloadPhotosFromShutterfly = async ({
    cognitoIdToken: givenCognitoIdToken,
    downloadDelayFixedMilliseconds = 2000,
    downloadDelayJitterMilliseconds = 1000,
    endTimeUnixSeconds: givenEndTimeUnixSeconds,
    startTimeUnixSeconds: givenStartTimeUnixSeconds,
}: IDownloadPhotosFromShutterflyParameters): Promise<void> => {
    console.log('\nAuthenticating...');
    console.group();
    let cognitoIdToken: string;
    if (typeof givenCognitoIdToken === 'string') {
        cognitoIdToken = givenCognitoIdToken;
        console.log('Skipping Shutterfly login and using given Cognito idToken.');
    } else {
        console.log('Logging in to Shutterfly...');
        const puppeteerCognitoIdToken = await logInToShutterflyViaPuppeteer();
        if (typeof puppeteerCognitoIdToken !== 'string' || !puppeteerCognitoIdToken.length) {
            throw new Error('ERROR: Failed to log in to Shutterfly.');
        }
        cognitoIdToken = puppeteerCognitoIdToken;
        console.log(`Using Cognito idToken from Shutterfly:\n${puppeteerCognitoIdToken}`);
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
    console.groupEnd();
    console.log('...done!');

    console.log('\nBuilding list of downloadable photos...');
    console.group();
    const moments = await fetchMoments(cognitoIdToken, startTimeUnixSeconds, endTimeUnixSeconds);
    console.groupEnd();
    console.log('...done!');

    console.log(`\nDownloading ${moments.length} photos...`);
    console.group();
    // Download files in serial with interstitial delay and jitter to avoid overwhelming the server.
    // @see https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
    for (let i = 0, j = moments.length; i < j; i++) {
        if (i > 0) {
            const delayMilliseconds = downloadDelayFixedMilliseconds + generateRandomInteger(0, downloadDelayJitterMilliseconds);
            process.stdout.write(`Waiting ${delayMilliseconds} milliseconds...`);
            await sleepAsync(delayMilliseconds);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        }
        console.log(`Downloading photo ${i + 1} of ${moments.length} (moment ${moments[i].uid})...`);
        await downloadAsync({
            fromUrl: `${THISLIFE_DOWNLOAD_URL}?accessToken=${encodeURIComponent(cognitoIdToken)}&momentId=${encodeURIComponent(moments[i].uid)}&source=library`,
            toDirectory: 'ignore', // TODO: abstract to command-line parameter
            toFileName: (contentDispositionFileName = DEFAULT_FILE_NAME) => {
                // Convert 1234567890 => 1234567890000 => '2009-02-13T23:31:30.000Z' => '2009-02-13 23_31_30'.
                const momentDate = new Date(parseInt(moments[i].moment_date, 10) * 1000);
                const dateString = momentDate.toISOString().replace(/T/g, ' ').replace(/:/g, '_').split('.')[0];
                // Separate base name from extension.
                const { baseName, extension } = getFileNameParts(contentDispositionFileName);
                // Combine. Example: '2009-02-13 23_31_30 vacation (1836271517531475).jpg'
                return `${dateString} ${baseName} (${moments[i].uid})${typeof extension === 'string' ? `.${extension}` : ''}`;
            },
        });
    }
    console.groupEnd();
    console.log('...done!');

    return;
};

// TODO: add download path as command-line parameter
downloadPhotosFromShutterfly(parseDownloadPhotosFromShutterflyParameters());
