import { Cookie as ICookie } from 'puppeteer';

/** Fields extracted from a browser session. */
export interface ISession {
    /** Cookies. */
    cookies: ICookie[];
    /** Session start time in milliseconds since Unix epoch. */
    startTimeUnixMilliseconds: number;
}
