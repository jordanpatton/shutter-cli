import { THISLIFE_JSON_URL } from './common/constants.js';
import { IThisLifeApiResponseJson } from './common/types.js';

/** Payload format for successful request to `getPaginatedMoments`. */
interface IGetPaginatedMomentsResponseJsonSuccessPayload {
    moments: {
        /** Stringified `number`. Seconds since Unix epoch. */
        created: string;
        /** Stringified `number`. Seconds since Unix epoch. */
        effects_modified_date: string;
        encrypted_id: string;
        /** Stringified `number`. */
        life_uid: string;
        /** Stringified `number`. Seconds since Unix epoch. */
        moment_date: string;
        /** We want the value to be `'image'`. */
        moment_type: string;
        /** Pixels. */
        orig_height: number;
        /** Pixels. */
        orig_width: number;
        rating: number;
        /** Stringified `number`. */
        uid: string;
    }[];
    morePages: boolean;
    /** Stringified `number`. Seconds since Unix epoch. */
    oldestMomentTimestamp: number;
    signature: number;
}
/** Response json format for `getPaginatedMoments`. */
type TGetPaginatedMomentsResponseJson = IThisLifeApiResponseJson<IGetPaginatedMomentsResponseJsonSuccessPayload>;

/**
 * Fetches paginated moments.
 * @param cognitoIdToken - Identification token from Amazon Cognito authentication service.
 * @returns Promisified moments. Settles when moments are ready.
 */
export const fetchPaginatedMomentsViaApi = async (
    cognitoIdToken: string,
): Promise<IGetPaginatedMomentsResponseJsonSuccessPayload['moments'] | undefined> => {
    const response = await fetch(`${THISLIFE_JSON_URL}?method=getPaginatedMoments`, {
        body: `{"method":"getPaginatedMoments","params":["${cognitoIdToken}","1189382400","1727136000",2000,false,false,"",true],"headers":{"X-SFLY-SubSource":"library"},"id":null}`,
        method: 'POST'
    });
    console.log(response);
    const responseJson: TGetPaginatedMomentsResponseJson = await response.json();
    console.log(responseJson);
    return responseJson.result.success && typeof responseJson.result.payload === 'object'
        ? (responseJson.result.payload as IGetPaginatedMomentsResponseJsonSuccessPayload).moments
        : undefined;
};
