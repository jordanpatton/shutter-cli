import { ONE_DAY_IN_MILLISECONDS, THISLIFE_JSON_URL } from './common/constants.js';
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
 * @returns Promisified response payload. Settles when payload is ready.
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
    if (!responseJson.result.success || typeof responseJson.result.payload !== 'object') {
        throw new Error('ERROR: Failed to fetch skeleton.');
    }
    // else
    return responseJson.result.payload as IGetSkeletonResponseJsonSuccessPayload;
};

/**
 * Fetches a skeleton via API and derives a time range from the payload.
 * @param cognitoIdToken - Identification token from Amazon Cognito authentication service.
 * @returns Promisified object with fields derived from skeleton. Settles when fields are ready.
 */
export const fetchSkeleton = async (
    cognitoIdToken: string,
): Promise<{
    /** Derived end time in seconds since Unix epoch. */
    endTimeUnixSeconds: number;
    /** **Total** number of moments in skeleton (including those outside the time range). */
    numberOfSkeletonMoments: IGetSkeletonResponseJsonSuccessPayload['momentCount'];
    /** Derived start time in seconds since Unix epoch. */
    startTimeUnixSeconds: number;
}> => {
    const { momentCount, skeleton } = await fetchSkeletonViaApi(cognitoIdToken);
    if (!Array.isArray(skeleton) || !skeleton.length) {
        throw new Error('ERROR: Malformed skeleton.');
    }
    console.log(`Skeleton contains ${momentCount} moments.`);

    // `skeleton[].date` is a `string` with format YYYY-mm-dd.
    skeleton.sort((a, b) => (new Date(a.date)).getTime() - (new Date(b.date)).getTime());
    const { date: earliestSkeletonDateString } = skeleton[0];
    const { date: latestSkeletonDateString } = skeleton[skeleton.length - 1];
    console.log(`Skeleton date range: ${earliestSkeletonDateString} to ${latestSkeletonDateString}.`);

    // Start time is 24 hours earlier than `earliestSkeletonDateString`.
    const startTimeUnixSeconds = Math.max(
        Math.round(((new Date(earliestSkeletonDateString)).getTime() - ONE_DAY_IN_MILLISECONDS) / 1000),
        0
    );
    // End time is 24 hours later than `latestSkeletonDateString`.
    const endTimeUnixSeconds = Math.min(
        Math.round(((new Date(latestSkeletonDateString)).getTime() + ONE_DAY_IN_MILLISECONDS) / 1000),
        Number.MAX_SAFE_INTEGER
    );
    console.log(`Calculated time range (Unix seconds): ${startTimeUnixSeconds} to ${endTimeUnixSeconds}.`);

    return { endTimeUnixSeconds, numberOfSkeletonMoments: momentCount, startTimeUnixSeconds };
};
