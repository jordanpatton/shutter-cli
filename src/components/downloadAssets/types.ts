/** Moment object from ThisLife API. */
export interface IMoment {
    /** Stringified `number`. Seconds since Unix epoch. */
    created: string;
    /** Stringified `number`. Seconds since Unix epoch. */
    effects_modified_date: string;
    /** Only present in response payload if you enable encryption. */
    encrypted_id?: string;
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

// /** ThisLife Download API failure response json. Is only used when download fails; otherwise response body is file. */
// interface IThisLifeDownloadFailureResponseJson {
//     body: {
//         /** Known good values: `null`. */
//         errors: any;
//         id: string;
//         result: {
//             /** Known good values: `['Moment not found.']`. */
//             errors: string[];
//             /** Known good values: `'Moment not found.'`. */
//             message: string;
//             payload: null;
//             success: false;
//         };
//     };
// }

/** ThisLife JSON API response json. Has a discriminated union where `result.success` determines `result.payload`. */
export interface IThisLifeJsonResponseJson<TSuccessPayload> {
    /** Known good values: `null`. */
    error: any;
    id: string;
    result: { // Unconditional fields...
        /** Known good values: `'ResponseWrapper'`. */
        _explicitType: string;
        /** Known good values: `null`. */
        errors: any;
        message: string;
    } & (
        { // Conditional fields: if `success` is `true`...
            /** Payload is API-method-specific format on success. */
            payload: TSuccessPayload;
            /** Discriminator for `payload`. */
            success: true;
        } | { // Conditional fields: if `success` is `false`...
            /** Payload is `[]` for invalid token OR `null` for bad/missing parameter. */
            payload: [] | null;
            /** Discriminator for `payload`. */
            success: false;
        }
    );
}
