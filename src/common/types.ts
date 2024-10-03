/** Response json format for ThisLife API. */
export interface IThisLifeApiResponseJson<TSuccessPayload> {
    /** Known good values: `null`. */
    error: any;
    id: string;
    result: {
        /** Known good values: `'ResponseWrapper'`. */
        _explicitType: string;
        /** Known good values: `null`. */
        errors: any;
        message: string;
        /** Payload is `[]` on failure or API-method-specific format on success. */
        payload: [] | TSuccessPayload;
        success: boolean;
    }
}
