import { authenticate, parseAuthenticateParameters } from './components/authenticate/index.js';
import { downloadAssets, parseDownloadAssetsParameters } from './components/downloadAssets/index.js';
import { getCommandLineParameter } from './utilities/getCommandLineParameter.js';

/**
 * Main entrypoint for this program.
 * 
 * @returns Command result or void.
 */
export const main = (): ReturnType<typeof authenticate> | ReturnType<typeof downloadAssets> | void => {
    const command = getCommandLineParameter('--command').value;
    if (typeof command === 'string') {
        switch (command) {
            case 'authenticate':
                return authenticate(parseAuthenticateParameters());
            case 'download-assets':
                return downloadAssets(parseDownloadAssetsParameters());
            default:
                throw new RangeError('command (required) must be one of: authenticate, download-assets.');
        };
    } else {
        throw new TypeError('command (required) must be a non-empty string.');
    }
};

main();
