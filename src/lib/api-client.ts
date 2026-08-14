import { config } from "@/lib/config";

/**
 * Error thrown for any non-2xx API response.
 *
 * The backend's GlobalExceptionHandler returns two different shapes depending on the
 * failure: a CalculationException yields `{"error": "message"}`, while a bean-validation
 * failure yields a flat field-name -> message map with no "error" key. `fieldErrors` is
 * populated only in the latter case, so callers can show inline errors when possible and
 * fall back to `message` otherwise.
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

async function parseErrorBody(response: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return new ApiError(response.status, response.statusText || "Request failed");
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string") {
      return new ApiError(response.status, record.error);
    }

    const fieldErrors: Record<string, string> = {};
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === "string") {
        fieldErrors[key] = value;
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return new ApiError(response.status, "Validation failed", fieldErrors);
    }
  }

  return new ApiError(response.status, response.statusText || "Request failed");
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
