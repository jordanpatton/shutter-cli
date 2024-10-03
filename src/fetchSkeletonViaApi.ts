import { THISLIFE_JSON_URL } from './common/constants.js';
import { IThisLifeApiResponseJson } from './common/types.js';

/** Payload format for successful request to `getSkeleton`. */
interface IGetSkeletonResponseJsonSuccessPayload {
    momentCount: number;
    signature: number;
    skeleton: {
        /** Stringified `number`. */
        count: string;
        /** Stringified date in format `YYYY-mm-dd`. */
        date: string;
    }[];
}
/** Response json format for `getSkeleton`. */
type TGetSkeletonResponseJson = IThisLifeApiResponseJson<IGetSkeletonResponseJsonSuccessPayload>;

/**
 * Fetches basic skeleton that Shutterfly uses to construct the photo library page and
 * perform various other requests.
 * @param cognitoIdToken - Identification token from Amazon Cognito authentication service.
 * @returns Promisified skeleton. Settles when skeleton is ready.
 */
export const fetchSkeletonViaApi = async (
    cognitoIdToken: string,
): Promise<IGetSkeletonResponseJsonSuccessPayload> => {
    const stringifiedBodyParams: string[] = [
        `"${cognitoIdToken}"`, // {string} Amazon Cognito identification token.
        'false',               // {boolean} Whether or not to sort by upload date.
    ];
    const response = await fetch(`${THISLIFE_JSON_URL}?method=getSkeleton`, {
        body: `{"method":"getSkeleton","params":[${stringifiedBodyParams.join(',')}],"headers":{"X-SFLY-SubSource":"library"},"id":null}`,
        method: 'POST'
    });
    const responseJson: TGetSkeletonResponseJson = await response.json();
    // HTTP response code may be 200, but response body can still indicate failure.
    if (!responseJson.result.success || typeof responseJson.result.payload !== 'object') {
        throw new Error('ERROR: Failed to fetch skeleton.');
    }
    // else
    return responseJson.result.payload as IGetSkeletonResponseJsonSuccessPayload;
};
