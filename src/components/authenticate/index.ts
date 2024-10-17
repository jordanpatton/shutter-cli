import { getCommandLineParameter } from '../../utilities/getCommandLineParameter.js';
import { Authenticator } from './components/Authenticator/index.js';

/** `authenticate` parameters. */
interface IAuthenticateParameters {
    /** Whether or not to be verbose. */
    isVerbose?: boolean;
}

/**
 * Parses `authenticate` parameters.
 * 
 * @returns Parsed parameters.
 */
export const parseAuthenticateParameters = (): IAuthenticateParameters => {
    const parsed: IAuthenticateParameters = {};
    // is-verbose (optional): boolean
    const isVerbose = getCommandLineParameter('--is-verbose').value;
    if (typeof isVerbose === 'string') {
        if (isVerbose === 'true' || isVerbose === 'false') {
            parsed.isVerbose = isVerbose === 'true';
            console.log('Parsed is-verbose from command line.');
        } else {
            throw new TypeError('is-verbose (optional) must be true or false.');
        }
    }
    return parsed;
};

/**
 * Establishes an authenticated session.
 * 
 * @param parameters - Parameters.
 * @returns Promisified object with `Authenticator` instance and Cognito idToken. Settles when fields are ready.
 */
export const authenticate = async ({
    isVerbose = false,
}: IAuthenticateParameters): Promise<{
    authenticator: Authenticator;
    cognitoIdToken: string;
}> => {
    const authenticator = new Authenticator();
    const cognitoIdToken = await authenticator.authenticate(isVerbose);
    return { authenticator, cognitoIdToken };
};
