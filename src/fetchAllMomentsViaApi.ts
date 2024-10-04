import { THISLIFE_JSON_URL } from './common/constants.js';
import { IThisLifeApiResponseJson } from './common/types.js';

/** Moment object from ThisLife API. */
interface IMoment {
    /** Stringified `number`. Seconds since Unix epoch. */
    created: string;
    /** Stringified `number`. Seconds since Unix epoch. */
    effects_modified_date: string;
    /** Technically optional if you disable encryption, but we intentionally ignore that fact. */
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
}
/** Payload format for successful request to `getPaginatedMoments`. */
interface IGetPaginatedMomentsResponseJsonSuccessPayload {
    /** Can also be a hexadecimal-encoded string, but we intentionally ignore that fact. */
    moments: IMoment[];
    /** Whether or not more pages are available. */
    morePages: boolean;
    /** Seconds since Unix epoch. NOT stringified. */
    oldestMomentTimestamp: number;
    signature: number;
}
/** Response json format for `getPaginatedMoments`. */
type TGetPaginatedMomentsResponseJson = IThisLifeApiResponseJson<IGetPaginatedMomentsResponseJsonSuccessPayload>;

/**
 * Fetches paginated moments from newest to oldest.
 * - In order to paginate, you must hold `startTimeUnixSeconds` constant and shift
 *   `endTimeUnixSeconds` earlier after each request (replace with `oldestMomentTimestamp`
 *   from response) until `morePages` is `false`.
 * - **DO NOT** subtract time from `oldestMomentTimestamp` before using it to replace
 *   `endTimeUnixSeconds` between requests. Doing so could cause you to skip moments that
 *   share the same `moment_date`. Instead, you'll need to manually check for an infinite
 *   loop and deduplicate the results. (Yes, the remote API's paging system sucks.)
 * - **INFINITE LOOP:** After each request, you must verify that `oldestMomentTimestamp`
 *   is not the same as the prior request. If it is the same, then there are too many
 *   items sharing the same `moment_date`, and you will be caught in an infinite loop. You
 *   must either increase `maximumNumberOfItemsPerPage` until `oldestMomentTimestamp`
 *   changes OR error out.
 * - **DEDUPLICATION:** After completing multiple pagination requests, you should
 *   deduplicate the accumulated moments by `uid`.
 * @param cognitoIdToken - Identification token from Amazon Cognito authentication service.
 * @param startTimeUnixSeconds - Start time in seconds since Unix epoch. Should remain constant across requests.
 * @param endTimeUnixSeconds - End time in seconds since Unix epoch. Should decrease with each request.
 * @param maximumNumberOfItemsPerPage - Maximum number of items per page.
 * @returns Promisified response payload. Settles when payload is ready.
 */
const fetchPaginatedMomentsViaApi = async (
    cognitoIdToken: string,
    startTimeUnixSeconds: number,
    endTimeUnixSeconds: number,
    maximumNumberOfItemsPerPage: number = 2000,
): Promise<IGetPaginatedMomentsResponseJsonSuccessPayload> => {
    const stringifiedBodyParams: string[] = [
        `"${cognitoIdToken}"`,            // {string} Amazon Cognito identification token.
        `"${startTimeUnixSeconds}"`,      // {string} Start time in seconds since Unix epoch.
        `"${endTimeUnixSeconds}"`,        // {string} End time in seconds since Unix epoch.
        `${maximumNumberOfItemsPerPage}`, // {number} Maximum number of items per page.
        'false',                          // {boolean} Whether or not to sort by upload date.
        'false',                          // {boolean} Whether or not to return `moments` as a hexadecimal-encoded string.
        '""',                             // {string} Moment type. Known good values: "", "image".
        'true',                           // {boolean} Whether or not to include `encrypted_id` in returned `moments` items.
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

/** TODO. */
export const fetchAllMomentsViaApi = async (
    cognitoIdToken: string,
    startTimeUnixSeconds: number,
    endTimeUnixSeconds: number,
): Promise<IMoment[]> => {
    let allMoments: IMoment[] = [];
    while (true) {
        const { moments } = await fetchPaginatedMomentsViaApi(cognitoIdToken, startTimeUnixSeconds, endTimeUnixSeconds, 2);
        if (!Array.isArray(moments)) {
            throw new Error('ERROR: Malformed moments.');
        }
        // TODO: check that `oldestMomentTimestamp` is changing after each request and is LOWER each time
        // TODO: deduplicate by `uid` as we go (instead of at the end of all requests)
        allMoments = [...allMoments, ...moments];
        // TODO: console.log status updates
        // TODO: break when `morePages` is `false`
        break; // TODO: remove this when other break condition is done
    }
    return allMoments;
};
