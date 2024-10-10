import { THISLIFE_DOWNLOAD_URL } from './common/constants.js';
import { DEFAULT_FILE_NAME, downloadAsync, IDownloadAsyncParameters } from './common/helpers/downloadAsync.js';
import { generateRandomInteger } from './common/helpers/generateRandomInteger.js';
import { getFileNameParts } from './common/helpers/getFileNameParts.js';
import { sleepAsync } from './common/helpers/sleepAsync.js';
import { IMoment } from './common/types.js';

/**
 * Downloads given list of photos from Shutterfly. Downloads in serial with interstitial
 * delay and jitter to avoid overwhelming the server.
 * 
 * @param cognitoIdToken - Identification token from Amazon Cognito authentication service.
 * @param moments - Shutterfly moments.
 * @param toDirectory - Destination directory for downloaded photos.
 * @param delayFixedMilliseconds - Fixed delay between downloads in integer milliseconds.
 * @param delayJitterMilliseconds - Jittered delay between downloads in integer milliseconds.
 * @returns Promisified void. Settles when all downloads are finished.
 * 
 * @see https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
 */
export const downloadPhotos = async (
    cognitoIdToken: string,
    moments: IMoment[],
    toDirectory: IDownloadAsyncParameters['toDirectory'] = '.',
    delayFixedMilliseconds: number = 2000,
    delayJitterMilliseconds: number = 1000,
): Promise<void> => {
    for (let i = 0, j = moments.length; i < j; i++) {
        if (i > 0) {
            const delayMilliseconds = delayFixedMilliseconds + generateRandomInteger(0, delayJitterMilliseconds);
            process.stdout.write(`Waiting ${delayMilliseconds} milliseconds...`);
            await sleepAsync(delayMilliseconds);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        }
        console.log(`Downloading photo ${i + 1} of ${moments.length} (moment ${moments[i].uid})...`);
        await downloadAsync({
            fromUrl: `${THISLIFE_DOWNLOAD_URL}?accessToken=${encodeURIComponent(cognitoIdToken)}&momentId=${encodeURIComponent(moments[i].uid)}&source=library`,
            toDirectory,
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
    return;
};
