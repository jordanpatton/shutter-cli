import { THISLIFE_JSON_URL } from '../constants.js';
import { IMoment, IThisLifeApiResponseJson } from '../types.js';

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
 * 
 * @param cognitoIdToken - Identification token from Amazon Cognito authentication service.
 * @param startTimeUnixSeconds - Start time in seconds since Unix epoch. Should remain constant across requests.
 * @param endTimeUnixSeconds - End time in seconds since Unix epoch. Should decrease with each request.
 * @param maximumNumberOfItemsPerPage - Maximum number of items per page. Should be large to avoid an infinite loop.
 * @returns Promisified response payload. Settles when payload is ready.
 */
const fetchPaginatedMomentsViaApi = async (
    cognitoIdToken: string,
    startTimeUnixSeconds: number,
    endTimeUnixSeconds: number,
    maximumNumberOfItemsPerPage: number = 1000,
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

/**
 * Fetches all moments for a given time range.
 * 
 * @param cognitoIdToken - Identification token from Amazon Cognito authentication service.
 * @param startTimeUnixSeconds - Start of time range in seconds since Unix epoch.
 * @param endTimeUnixSeconds - End of time range in seconds since Unix epoch.
 * @returns Promisified array of moments. Settles when data is ready.
 * 
 * @see https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
 */
export const fetchMoments = async (
    cognitoIdToken: string,
    startTimeUnixSeconds: number,
    endTimeUnixSeconds: number,
): Promise<IMoment[]> => {
    let accumulatedMoments: IMoment[] = [];
    let previousOldestMomentTimestamp: number | undefined;
    for (let i = 0; true; i++) {
        // Fetch a page of moments. Pagination occurs from newest to oldest, so end time is the only moving target.
        const { moments, morePages, oldestMomentTimestamp } = await fetchPaginatedMomentsViaApi(
            cognitoIdToken,
            startTimeUnixSeconds,
            typeof previousOldestMomentTimestamp === 'number' ? previousOldestMomentTimestamp : endTimeUnixSeconds,
            1000, // The more items per page, the less likely it is that we'll end up in an infinite loop.
        );
        // Validate moments.
        if (!Array.isArray(moments)) {
            throw new Error('ERROR: Malformed moments.');
        }
        // `oldestMomentTimestamp` must decrease with every iteration or else we're stuck in an infinite loop.
        if (typeof previousOldestMomentTimestamp === 'number' && oldestMomentTimestamp >= previousOldestMomentTimestamp) {
            // Alternatively, we could increase number of items per page and try again (instead of erroring out).
            throw new Error('ERROR: Infinite loop while fetching moments.');
        } else {
            previousOldestMomentTimestamp = oldestMomentTimestamp;
        }
        // Deduplicate and accumulate moments.
        const deduplicatedMoments = moments.filter(v => !accumulatedMoments.some(w => w.uid === v.uid));
        accumulatedMoments = [...accumulatedMoments, ...deduplicatedMoments];
        // Notify user of progress.
        console.log(`Request #${i + 1} succeeded. Fetched ${moments.length} moments (duplicates: ${moments.length - deduplicatedMoments.length}; total: ${accumulatedMoments.length}; oldest: ${oldestMomentTimestamp}).`);
        // Stop iterating if there are no more pages.
        if (!morePages) {
            break;
        }
    }
    return accumulatedMoments;
};
