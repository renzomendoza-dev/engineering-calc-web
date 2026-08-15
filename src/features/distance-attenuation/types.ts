/** Mirrors calc-api's DistanceAttenuationRequest field-for-field. */
export interface DistanceAttenuationRequest {
  referenceSplDb: number;
  referenceDistance: number;
  targetDistance: number;
}

/**
 * Mirrors calc-api's DistanceAttenuationResponse field-for-field. The response deliberately
 * doesn't echo the request's inputs (same convention as every other calc-api response DTO), so
 * the results panel gets the submitted request passed alongside this for display.
 */
export interface DistanceAttenuationResponse {
  targetSplDb: number;
  attenuationDb: number;
}
