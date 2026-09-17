import { config } from "@/lib/config";

/**
 * Error thrown for any non-2xx API response.
 *
 * The backend returns one error shape for every 400:
 * `{"message": string, "fieldErrors": {fieldName: message}}`. `fieldErrors` here is set only
 * when that map is non-empty, so callers can show inline errors when possible and fall back
 * to `message` otherwise.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Placeholder messages that carry no information beyond "some fields failed" — the backend's
 * `GlobalExceptionHandler.VALIDATION_FAILED_MESSAGE`, and the one this client assigns to the
 * legacy flat field-map body. When an ApiError has fieldErrors and one of these as its message,
 * the field messages are the whole story; the message itself adds nothing worth showing.
 */
const LEGACY_VALIDATION_FAILED_MESSAGE = "Validation failed";
const GENERIC_VALIDATION_MESSAGES = new Set(["Request validation failed", LEGACY_VALIDATION_FAILED_MESSAGE]);

export function isGenericValidationMessage(message: string): boolean {
  return GENERIC_VALIDATION_MESSAGES.has(message);
}

/** Keeps only the string-valued entries of a plain object; anything else yields `{}`. */
function toStringRecord(value: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === "string") {
        result[key] = entry;
      }
    }
  }
  return result;
}

async function parseErrorBody(response: Response): Promise<ApiError> {
  const fallbackMessage = response.statusText || "Request failed";

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return new ApiError(response.status, fallbackMessage);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return new ApiError(response.status, fallbackMessage);
  }
  const record = body as Record<string, unknown>;

  // Current contract. Requiring both keys keeps an unrelated `{"message": ...}` body (e.g. from
  // a proxy in front of the API) from being mistaken for it.
  if (typeof record.message === "string" && "fieldErrors" in record) {
    const fieldErrors = toStringRecord(record.fieldErrors);
    return new ApiError(
      response.status,
      record.message,
      Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    );
  }

  // A `{"message": ...}` body without fieldErrors (typically from a proxy or gateway in front of
  // the API) is a plain message. Checked before the legacy flat-map branch below, which would
  // otherwise read "message" as the name of a failed request field. No request DTO has a field
  // called "message", so this can't swallow a real legacy field error.
  if (typeof record.message === "string") {
    return new ApiError(response.status, record.message);
  }

  // Legacy shapes, from before the backend unified its error body: `{"error": message}` for
  // calculation errors (also matches Spring's default error body), and a flat
  // field -> message map for validation errors. Kept so this client works against a backend
  // that hasn't been redeployed yet; safe to delete once the new backend is live everywhere.
  if (typeof record.error === "string") {
    return new ApiError(response.status, record.error);
  }
  const legacyFieldErrors = toStringRecord(record);
  if (Object.keys(legacyFieldErrors).length > 0) {
    return new ApiError(response.status, LEGACY_VALIDATION_FAILED_MESSAGE, legacyFieldErrors);
  }

  return new ApiError(response.status, fallbackMessage);
}

export async function apiPost<TRequest, TResponse>(
  path: string,
  body: TRequest,
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    throw await parseErrorBody(response);
  }

  return (await response.json()) as TResponse;
}

export async function apiGet<TResponse>(
  path: string,
  params?: Record<string, string>,
): Promise<TResponse> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${path}${query}`);
  } catch {
    throw new ApiError(0, "Unable to reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    throw await parseErrorBody(response);
  }

  return (await response.json()) as TResponse;
}
