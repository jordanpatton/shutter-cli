import { THISLIFE_JSON_URL } from '../constants.js';
import { IThisLifeJsonResponseJson } from '../types.js';

/** Payload format for successful request to `getSkeleton` (with or without data in the response). */
interface IGetSkeletonResponseJsonSuccessPayload {
    momentCount: number;
    signature: number;
    /** Skeleton is `null` if there is no data available (i.e., account has no moments). */
    skeleton: {
        /** Stringified `number`. */
        count: string;
        /** Stringified date in format `YYYY-mm-dd`. */
        date: string;
    }[] | null;
}
/** Response json format for `getSkeleton` (success or failure, with or without data in the response). */
type TGetSkeletonResponseJson = IThisLifeJsonResponseJson<IGetSkeletonResponseJsonSuccessPayload>;

/** One day in milliseconds. */
const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

/**
 * Fetches basic skeleton that Shutterfly uses to construct the library page and perform
 * various other requests.
 * 
 * @param cognitoIdToken - Identification token from Amazon Cognito authentication service.
 * @returns Promisified successful response payload. (Not null, but `skeleton` may be null if account has no moments.) Settles when payload is ready.
 */
const fetchSkeletonViaApi = async (
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
    if (!responseJson.result.success) {
        throw new Error(`Failed to fetch skeleton. (${responseJson.result.message})`);
    }
    // else
    return responseJson.result.payload;
};

/**
 * Fetches a skeleton via API and derives a time range from the payload.
 * 
 * @param cognitoIdToken - Identification token from Amazon Cognito authentication service.
 * @returns Promisified object with fields derived from skeleton OR void if skeleton is empty. Settles when data is ready.
 */
export const fetchSkeleton = async (
    cognitoIdToken: string,
): Promise<{
    /** Earliest date string in skeleton items. */
    earliestDateString: string;
    /** Derived end time in seconds since Unix epoch. */
    endTimeUnixSeconds: number;
    /** Latest date string in skeleton items. */
    latestDateString: string;
    /** **Total** number of moments in skeleton (including those outside the time range). */
    numberOfMoments: IGetSkeletonResponseJsonSuccessPayload['momentCount'];
    /** Derived start time in seconds since Unix epoch. */
    startTimeUnixSeconds: number;
} | void> => {
    const { momentCount, skeleton } = await fetchSkeletonViaApi(cognitoIdToken);
    if (!Array.isArray(skeleton) || !skeleton.length) {
        console.log('Request succeeded, but skeleton is empty.');
        return;
    } else {
        // `skeleton[].date` is a `string` with format YYYY-mm-dd.
        skeleton.sort((a, b) => (new Date(a.date)).getTime() - (new Date(b.date)).getTime());
        const { date: earliestDateString } = skeleton[0];
        const { date: latestDateString } = skeleton[skeleton.length - 1];
        console.log(`Request succeeded. ${momentCount} moments are available from ${earliestDateString} to ${latestDateString}.`);

        // Start time is one day earlier than `earliestDateString`.
        const startTimeUnixSeconds = Math.round(((new Date(earliestDateString)).getTime() - ONE_DAY_IN_MILLISECONDS) / 1000);
        // End time is one day later than `latestDateString`.
        const endTimeUnixSeconds = Math.round(((new Date(latestDateString)).getTime() + ONE_DAY_IN_MILLISECONDS) / 1000);

        return { earliestDateString, endTimeUnixSeconds, latestDateString, numberOfMoments: momentCount, startTimeUnixSeconds };
    }
};
