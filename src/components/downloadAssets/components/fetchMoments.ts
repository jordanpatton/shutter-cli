import { sleepAsync } from '../../../utilities/sleepAsync.js';
import { THISLIFE_JSON_URL } from '../constants.js';
import { IMoment, IThisLifeJsonResponseJson } from '../types.js';

/** Payload format for successful request to `getPaginatedMoments` (with data in the response). */
interface IGetPaginatedMomentsResponseJsonSuccessPayloadWithData {
    /** Can be a hexadecimal-encoded string when requested as such. */
    moments: IMoment[] | string;
    /** Whether or not more pages are available. */
    morePages: boolean;
    /** Seconds since Unix epoch. NOT stringified. */
    oldestMomentTimestamp: number;
    signature: number;
}
/** Payload format for successful request to `getPaginatedMoments` (without data in the response). */
type TGetPaginatedMomentsResponseJsonSuccessPayloadWithoutData = [];
/** Payload format for successful request to `getPaginatedMoments` (with or without data in the response). */
type TGetPaginatedMomentsResponseJsonSuccessPayload = IGetPaginatedMomentsResponseJsonSuccessPayloadWithData | TGetPaginatedMomentsResponseJsonSuccessPayloadWithoutData;
/** Response json format for `getPaginatedMoments` (success or failure, with or without data in the response). */
type TGetPaginatedMomentsResponseJson = IThisLifeJsonResponseJson<TGetPaginatedMomentsResponseJsonSuccessPayload>;

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
 * @param cognitoIdToken - Identification token from Amazon Cognito identification service.
 * @param startTimeUnixSeconds - Start time in seconds since Unix epoch. Should remain constant across requests.
 * @param endTimeUnixSeconds - End time in seconds since Unix epoch. Should decrease with each request.
 * @param maximumNumberOfItemsPerPage - Maximum number of items per page. Should be large to avoid an infinite loop.
 * @returns Promisified successful response payload. (Not null, but may be empty array if page contains no data.) Settles when payload is ready.
 */
const fetchPaginatedMomentsViaApi = async (
    cognitoIdToken: string,
    startTimeUnixSeconds: number,
    endTimeUnixSeconds: number,
    maximumNumberOfItemsPerPage: number = 1000,
): Promise<TGetPaginatedMomentsResponseJsonSuccessPayload> => {
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
        headers: { // All of these headers are optional. (Request works without them.)
            // 'accept': 'application/json, text/javascript, */*; q=0.01',
            // 'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'pragma': 'no-cache'
        },
        method: 'POST'
    });
    if (!response.ok) {
        throw new Error(`[${response.status}] ${response.statusText}`);
    }
    const responseJson: TGetPaginatedMomentsResponseJson = await response.json();
    // HTTP response code may be 200, but response body can still indicate failure.
    if (!responseJson.result.success) {
        throw new Error(`Failed to fetch paginated moments. (${responseJson.result.message})`);
    }
    // else
    return responseJson.result.payload;
};

/**
 * Fetches all moments for a given time range.
 * 
 * @param cognitoIdToken - Function or string for obtaining a Cognito idToken.
 * @param startTimeUnixSeconds - Start of time range in seconds since Unix epoch.
 * @param endTimeUnixSeconds - End of time range in seconds since Unix epoch.
 * @param delayFixedMilliseconds - Fixed delay between requests in integer milliseconds.
 * @param delayJitterMilliseconds - Jittered delay between requests in integer milliseconds.
 * @returns Promisified array of moments. Settles when data is ready.
 * 
 * @see https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
 */
export const fetchMoments = async (
    cognitoIdToken: (() => Promise<string>) | string,
    startTimeUnixSeconds: number,
    endTimeUnixSeconds: number,
    delayFixedMilliseconds: number,
    delayJitterMilliseconds: number,
): Promise<IMoment[]> => {
    let accumulatedMoments: IMoment[] = [];
    let previousOldestMomentTimestamp: number | undefined;
    for (let i = 0; true; i++) {
        if (i > 0) {
            await sleepAsync(delayFixedMilliseconds, delayJitterMilliseconds, (ms) => `Waiting ${ms} milliseconds...`);
        }
        const _cognitoIdToken: string = typeof cognitoIdToken === 'function' ? await cognitoIdToken() : cognitoIdToken;
        // Fetch a page of moments. Pagination occurs from newest to oldest, so end time is the only moving target.
        const payload = await fetchPaginatedMomentsViaApi(
            _cognitoIdToken,
            startTimeUnixSeconds,
            typeof previousOldestMomentTimestamp === 'number' ? previousOldestMomentTimestamp : endTimeUnixSeconds,
            1000, // The more items per page, the less likely it is that we'll end up in an infinite loop.
        );
        // Verify that the response payload contains data.
        if (Array.isArray(payload)) {
            // Request succeeded, but payload contains no data. (Specified time range is probably empty.)
            console.log(`Request #${i + 1} succeeded, but payload is empty.`);
            break;
        } else {
            // Request succeeded, and payload contains data.
            const { moments, morePages, oldestMomentTimestamp } = payload;
            // `oldestMomentTimestamp` must decrease with every iteration or else we're stuck in an infinite loop.
            if (typeof previousOldestMomentTimestamp === 'number' && oldestMomentTimestamp >= previousOldestMomentTimestamp) {
                // Alternatively, we could increase number of items per page and try again (instead of erroring out).
                throw new Error('Detected infinite loop while fetching moments.');
            } else {
                previousOldestMomentTimestamp = oldestMomentTimestamp;
            }
            // Verify that `moments` is not a hexadecimal-encoded string.
            if (Array.isArray(moments)) {
                // Deduplicate and accumulate moments.
                const deduplicatedMoments = moments.filter(v => !accumulatedMoments.some(w => w.uid === v.uid));
                accumulatedMoments = [...accumulatedMoments, ...deduplicatedMoments];
                // Notify user of progress.
                console.log(`Request #${i + 1} succeeded. Fetched ${moments.length} moments (duplicates: ${moments.length - deduplicatedMoments.length}; total: ${accumulatedMoments.length}; oldest: ${oldestMomentTimestamp}).`);
            } else {
                // TODO: Handle hexadecimal-string-encoded moments.
                console.log(`Request #${i + 1} succeeded, but moments are hexadecimal-string-encoded. Skipping this page.`);
            }
            // Stop iterating if there are no more pages.
            if (!morePages) {
                break;
            }
        }
    }
    return accumulatedMoments;
};
