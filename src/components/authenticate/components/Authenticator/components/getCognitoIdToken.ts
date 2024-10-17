import { Cookie as ICookie } from 'puppeteer';

const COGNITO_COOKIE_NAME_ID_TOKEN_POSTFIX = '.idToken';
const COGNITO_COOKIE_NAME_PREFIX = 'CognitoIdentityServiceProvider.';

/**
 * Returns an Amazon Cognito idToken.
 * 
 * @param cookies - Cookies.
 * @returns Cognito idToken if it exists; otherwise undefined.
 */
export const getCognitoIdToken = (cookies: ICookie[]): string | undefined => {
    const value = cookies.find(
        v => v.name.startsWith(COGNITO_COOKIE_NAME_PREFIX) && v.name.endsWith(COGNITO_COOKIE_NAME_ID_TOKEN_POSTFIX)
    )?.value;
    return typeof value === 'string' && value.length ? value : undefined;
};
