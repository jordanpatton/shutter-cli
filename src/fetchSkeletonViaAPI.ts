import { THISLIFE_JSON_URL } from './common/constants.js';

/** Payload format for failed request. */
type TGetSkeletonResponseJsonFailurePayload = [];
/** Payload format for successful request. */
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
interface IGetSkeletonResponseJson {
    /** Unknown format; have only seen `null`. */
    error: any;
    id: string;
    result: {
        _explicitType: string;
        /** Unknown format; have only seen `null`. */
        errors: any;
        message: string;
        payload: TGetSkeletonResponseJsonFailurePayload | IGetSkeletonResponseJsonSuccessPayload;
        success: boolean;
    }
}

/**
 * Fetches basic skeleton that Shutterfly uses to construct the photo library page and
 * perform various other requests.
 * @param cognitoIdToken - Identification token from Amazon Cognito authentication service.
 * @returns Promisified skeleton. Settles when skeleton is ready.
 */
export const fetchSkeletonViaAPI = async (
    cognitoIdToken: string,
): Promise<IGetSkeletonResponseJsonSuccessPayload['skeleton'] | undefined> => {
    const response = await fetch(`${THISLIFE_JSON_URL}?method=getSkeleton`, {
        body: `{"method":"getSkeleton","params":["${cognitoIdToken}",false],"headers":{"X-SFLY-SubSource":"library"},"id":null}`,
        method: 'POST'
    });
    const responseJson: IGetSkeletonResponseJson = await response.json();
    return typeof responseJson.result.payload === 'object'
        ? (responseJson.result.payload as IGetSkeletonResponseJsonSuccessPayload).skeleton
        : undefined;
};
