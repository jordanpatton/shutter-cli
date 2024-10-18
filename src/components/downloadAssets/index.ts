import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';

import { getCommandLineParameter } from '../../utilities/getCommandLineParameter.js';
import { authenticate } from '../authenticate/index.js';
import { downloadAssetsSerial } from './components/downloadAssetsSerial.js';
import { fetchMoments } from './components/fetchMoments.js';
import { fetchSkeleton } from './components/fetchSkeleton.js';
import {
    DEFAULT_DELAY_FIXED_MILLISECONDS,
    DEFAULT_DELAY_JITTER_MILLISECONDS,
    DEFAULT_TO_DIRECTORY,
} from './constants.js';

/** `downloadAssets` parameters. */
interface IDownloadAssetsParameters {
    /** Fixed delay between serial requests in integer milliseconds. */
    delayFixedMilliseconds?: number;
    /** Jittered delay between serial requests in integer milliseconds. */
    delayJitterMilliseconds?: number;
    /** End of time range in seconds since Unix epoch. */
    endTimeUnixSeconds?: number;
    /** Start of time range in seconds since Unix epoch. */
    startTimeUnixSeconds?: number;
    /** Destination directory for downloaded assets. */
    toDirectory?: string;
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
    // delay-fixed-milliseconds (optional): positive integer
    const delayFixedMilliseconds = getCommandLineParameter('--delay-fixed-milliseconds').value;
    if (typeof delayFixedMilliseconds === 'string') {
        const f = parseFloat(delayFixedMilliseconds);
        if (!isNaN(f) && Number.isInteger(f) && f >= 0) {
            parsed.delayFixedMilliseconds = f;
            console.log('Parsed delay-fixed-milliseconds from command line.');
        } else {
            throw new TypeError('delay-fixed-milliseconds (optional) must be a positive integer.');
        }
    }
    // delay-jitter-milliseconds (optional): positive integer
    const delayJitterMilliseconds = getCommandLineParameter('--delay-jitter-milliseconds').value;
    if (typeof delayJitterMilliseconds === 'string') {
        const f = parseFloat(delayJitterMilliseconds);
        if (!isNaN(f) && Number.isInteger(f) && f >= 0) {
            parsed.delayJitterMilliseconds = f;
            console.log('Parsed delay-jitter-milliseconds from command line.');
        } else {
            throw new TypeError('delay-jitter-milliseconds (optional) must be a positive integer.');
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
    // to-directory (optional): existing directory
    const toDirectory = getCommandLineParameter('--to-directory').value;
    if (typeof toDirectory === 'string') {
        // TODO: Check that the path points to a directory (not a file).
        if (existsSync(toDirectory)) {
            parsed.toDirectory = toDirectory;
            console.log('Parsed to-directory from command line.');
        } else {
            throw new TypeError('to-directory (optional) must be an existing directory.');
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
    delayFixedMilliseconds = DEFAULT_DELAY_FIXED_MILLISECONDS,
    delayJitterMilliseconds = DEFAULT_DELAY_JITTER_MILLISECONDS,
    toDirectory = DEFAULT_TO_DIRECTORY,
    endTimeUnixSeconds: givenEndTimeUnixSeconds,
    startTimeUnixSeconds: givenStartTimeUnixSeconds,
}: IDownloadAssetsParameters): Promise<void> => {
    const { authenticator } = await authenticate({ isVerbose: true });

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
        const o = await fetchSkeleton(() => authenticator.authenticate(false));
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
    const moments = await fetchMoments(
        () => authenticator.authenticate(false),
        startTimeUnixSeconds,
        endTimeUnixSeconds,
        delayFixedMilliseconds,
        delayJitterMilliseconds
    );
    console.groupEnd();
    console.log('...done!');

    console.log('\nFiltering out already-downloaded assets...');
    console.group();
    const directoryEntries = await readdir(toDirectory, { recursive: false, withFileTypes: true });
    const fileNames = directoryEntries.filter(v => v.isFile()).map(v => v.name);
    // We could extract the moment.uid from each file name with the following RegEx: /\(([^.]+)\)(?:\.[^.]+)+$/
    // Instead of doing that, it's much easier to just search the entire list of file names for each moment.uid.
    const filteredMoments = moments.filter(v => !fileNames.some(w => w.includes(v.uid)));
    console.log(`Filtered out ${moments.length - filteredMoments.length} with ${filteredMoments.length} remaining.`);
    console.groupEnd();
    console.log('...done!');

    console.log(`\nDownloading ${filteredMoments.length} assets...`);
    console.group();
    await downloadAssetsSerial(
        () => authenticator.authenticate(false),
        filteredMoments,
        toDirectory,
        delayFixedMilliseconds,
        delayJitterMilliseconds
    );
    console.groupEnd();
    console.log('...done!');

    return;
};
