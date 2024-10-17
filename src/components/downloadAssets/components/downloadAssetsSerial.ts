import {
    DEFAULT_DOWNLOAD_FILE_NAME,
    downloadAsync,
    IDownloadAsyncParameters,
} from '../../../utilities/downloadAsync.js';
import { getFileNameParts } from '../../../utilities/getFileNameParts.js';
import { sleepAsync } from '../../../utilities/sleepAsync.js';
import { authenticate } from '../../authenticate/index.js';
import { IMoment } from '../types.js';

const THISLIFE_DOWNLOAD_URL = 'https://io.thislife.com/download';

/**
 * Downloads assets corresponding to given list of moments in serial (i.e., no parallel
 * downloads) with interstitial delay and jitter to avoid overwhelming the server.
 * 
 * @param moments - Shutterfly moments.
 * @param toDirectory - Destination directory for downloaded assets.
 * @param delayFixedMilliseconds - Fixed delay between downloads in integer milliseconds.
 * @param delayJitterMilliseconds - Jittered delay between downloads in integer milliseconds.
 * @returns Promisified void. Settles when all downloads are finished.
 * 
 * @see https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
 */
export const downloadAssetsSerial = async (
    moments: IMoment[],
    toDirectory: IDownloadAsyncParameters['toDirectory'],
    delayFixedMilliseconds: number,
    delayJitterMilliseconds: number,
): Promise<void> => {
    for (let i = 0, j = moments.length; i < j; i++) {
        if (i > 0) {
            await sleepAsync(delayFixedMilliseconds, delayJitterMilliseconds, (ms) => `Waiting ${ms} milliseconds...`);
        }
        const cognitoIdToken = await authenticate({ isVerbose: false });
        console.log(`Downloading asset ${i + 1} of ${moments.length} (moment ${moments[i].uid})...`);
        await downloadAsync({
            fromUrl: `${THISLIFE_DOWNLOAD_URL}?accessToken=${encodeURIComponent(cognitoIdToken)}&momentId=${encodeURIComponent(moments[i].uid)}&source=library`,
            toDirectory,
            toFileName: (contentDispositionFileName = DEFAULT_DOWNLOAD_FILE_NAME) => {
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
    return;
};
