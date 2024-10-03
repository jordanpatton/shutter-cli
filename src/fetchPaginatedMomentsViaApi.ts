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
        /** Known good values: `'image'`. */
        moment_type: string;
        /** Pixels. */
        orig_height: number;
        /** Pixels. */
        orig_width: number;
        rating: number;
        /** Stringified `number`. */
        uid: string;
    }[];
    /** Whether or not more pages are available. */
    morePages: boolean;
    /** Seconds since Unix epoch. NOT stringified. */
    oldestMomentTimestamp: number;
    signature: number;
}
/** Response json format for `getPaginatedMoments`. */
type TGetPaginatedMomentsResponseJson = IThisLifeApiResponseJson<IGetPaginatedMomentsResponseJsonSuccessPayload>;

/**
 * Fetches paginated moments.
 * @param cognitoIdToken - Identification token from Amazon Cognito authentication service.
 * @param startTimeUnixSeconds - Start time in seconds since Unix epoch.
 * @param endTimeUnixSeconds - End time in seconds since Unix epoch.
 * @returns Promisified moments. Settles when moments are ready.
 */
export const fetchPaginatedMomentsViaApi = async (
    cognitoIdToken: string,
    startTimeUnixSeconds: number | string,
    endTimeUnixSeconds: number | string,
): Promise<IGetPaginatedMomentsResponseJsonSuccessPayload> => {
    const stringifiedBodyParams: string[] = [
        `"${cognitoIdToken}"`,       // {string} Amazon Cognito identification token.
        `"${startTimeUnixSeconds}"`, // {string} Start time in seconds since Unix epoch.
        `"${endTimeUnixSeconds}"`,   // {string} End time in seconds since Unix epoch.
        '2',                         // {number} Maximum number of items per page. // TODO: 2000
        'false',                     // {boolean} Whether or not to sort by upload date.
        'false',                     // {boolean} Whether or not to get hexed data.
        '""',                        // {string} Moment type. Known good values: "", "image".
        'true',                      // {boolean} Whether or not to encrypt moments.
    ];
    const response = await fetch(`${THISLIFE_JSON_URL}?method=getPaginatedMoments`, {
        body: `{"method":"getPaginatedMoments","params":[${stringifiedBodyParams.join(',')}],"headers":{"X-SFLY-SubSource":"library"},"id":null}`,
        method: 'POST'
    });
    const responseJson: TGetPaginatedMomentsResponseJson = await response.json();
    // HTTP response code may be 200, but response body can still indicate failure.
    if (!responseJson.result.success || typeof responseJson.result.payload !== 'object') {
        throw new Error('ERROR: Failed to fetch paginated moments.');
    }
    // else
    return responseJson.result.payload as IGetPaginatedMomentsResponseJsonSuccessPayload;
};
