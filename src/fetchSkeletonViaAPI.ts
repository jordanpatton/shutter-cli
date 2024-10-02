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
): Promise<IGetSkeletonResponseJsonSuccessPayload['skeleton'] | undefined> => {
    const response = await fetch(`${THISLIFE_JSON_URL}?method=getSkeleton`, {
        body: `{"method":"getSkeleton","params":["${cognitoIdToken}",false],"headers":{"X-SFLY-SubSource":"library"},"id":null}`,
        method: 'POST'
    });
    const responseJson: TGetSkeletonResponseJson = await response.json();
    return responseJson.result.success && typeof responseJson.result.payload === 'object'
        ? (responseJson.result.payload as IGetSkeletonResponseJsonSuccessPayload).skeleton
        : undefined;
};
