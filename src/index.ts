import { getCommandLineParameter } from './utilities/getCommandLineParameter.js';
import { downloadAssets, parseDownloadAssetsParameters } from './workflows/downloadAssets.js';

/**
 * Main entrypoint for this program.
 * 
 * @returns Return value from workflow or void.
 */
export const main = (): ReturnType<typeof downloadAssets> | void => {
    const workflow = getCommandLineParameter('--workflow').value;
    if (typeof workflow === 'string') {
        switch (workflow) {
            case 'downloadAssets':
                return downloadAssets(parseDownloadAssetsParameters());
            default:
                throw new RangeError('workflow (required) must be one of: downloadAssets.');
        };
    } else {
        throw new TypeError('workflow (required) must be a non-empty string.');
    }
};

main();
