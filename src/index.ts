import { downloadAssets, parseDownloadAssetsParameters } from './components/downloadAssets/index.js';
import { getCommandLineParameter } from './utilities/getCommandLineParameter.js';

/**
 * Main entrypoint for this program.
 * 
 * @returns Return value from command or void.
 */
export const main = (): ReturnType<typeof downloadAssets> | void => {
    const command = getCommandLineParameter('--command').value;
    if (typeof command === 'string') {
        switch (command) {
            case 'download-assets':
                return downloadAssets(parseDownloadAssetsParameters());
            default:
                throw new RangeError('command (required) must be one of: download-assets.');
        };
    } else {
        throw new TypeError('command (required) must be a non-empty string.');
    }
};

main();
