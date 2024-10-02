/** Response json format for ThisLife API. */
export interface IThisLifeApiResponseJson<TSuccessPayload> {
    /** Unknown format; have only seen `null`. */
    error: any;
    id: string;
    result: {
        /** Have only seen `'ResponseWrapper'`. */
        _explicitType: string;
        /** Unknown format; have only seen `null`. */
        errors: any;
        message: string;
        /** Payload is `[]` on failure or API-method-specific format on success. */
        payload: [] | TSuccessPayload;
        success: boolean;
    }
}
