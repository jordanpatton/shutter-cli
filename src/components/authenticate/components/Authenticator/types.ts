/** Cognito token. */
interface ICognitoToken {
    comment: string | null;
    domain: string | null;
    httpOnly: boolean;
    maxAge: number;
    name: string;
    path: string | null;
    secure: boolean;
    value: string;
    version: number;
}

/** Fields extracted from a browser session. */
export interface ISession {
    /** Last refresh time for Cognito in milliseconds since Unix epoch. */
    cognitoLastRefreshTimeUnixMilliseconds: number;
    /** Cognito tokens. */
    cognitoTokens: ICognitoToken[];
}
