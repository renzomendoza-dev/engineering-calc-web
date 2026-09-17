import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet, apiPost, isGenericValidationMessage } from "./api-client";

function stubFetchResponse(status: number, body: string, statusText = "") {
  const fetchMock = vi.fn(async () => new Response(body, { status, statusText }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Runs apiPost and returns the ApiError it throws (fails the test if it doesn't throw one). */
async function postExpectingError(): Promise<ApiError> {
  const error = await apiPost("/api/test", {}).catch((err: unknown) => err);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiPost", () => {
  it("POSTs JSON to the configured base URL and returns the parsed body", async () => {
    const fetchMock = stubFetchResponse(200, JSON.stringify({ powerWatts: 65 }));

    await expect(apiPost("/api/electrical/power-consumption", { mode: "DIRECT_WATTAGE" })).resolves.toEqual({
      powerWatts: 65,
    });
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/api/electrical/power-consumption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "DIRECT_WATTAGE" }),
    });
  });

  it("maps a network failure to status 0 with a connection message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));

    const error = await postExpectingError();
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/unable to reach the server/i);
  });
});

describe("apiGet", () => {
  it("appends query params", async () => {
    const fetchMock = stubFetchResponse(200, "[]");

    await apiGet("/api/ref", { phaseType: "THREE_PHASE", motorClass: "INDUCTION" });
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/api/ref?phaseType=THREE_PHASE&motorClass=INDUCTION");
  });

  it("parses error bodies the same way as apiPost", async () => {
    stubFetchResponse(400, JSON.stringify({ message: "Unknown phase type: X", fieldErrors: {} }));

    await expect(apiGet("/api/ref")).rejects.toMatchObject({ status: 400, message: "Unknown phase type: X" });
  });
});

describe("error body parsing", () => {
  describe("current {message, fieldErrors} contract", () => {
    it("keeps a calculation error's message and leaves fieldErrors undefined when the map is empty", async () => {
      stubFetchResponse(400, JSON.stringify({ message: "No duct size satisfies these inputs.", fieldErrors: {} }));

      const error = await postExpectingError();
      expect(error.status).toBe(400);
      expect(error.message).toBe("No duct size satisfies these inputs.");
      expect(error.fieldErrors).toBeUndefined();
    });

    it("carries validation field errors", async () => {
      stubFetchResponse(
        400,
        JSON.stringify({
          message: "Request validation failed",
          fieldErrors: { totalOperatingHours: "must be greater than 0" },
        }),
      );

      const error = await postExpectingError();
      expect(error.message).toBe("Request validation failed");
      expect(error.fieldErrors).toEqual({ totalOperatingHours: "must be greater than 0" });
    });

    it("drops non-string field error values", async () => {
      stubFetchResponse(
        400,
        JSON.stringify({ message: "Request validation failed", fieldErrors: { voltage: "must not be null", bad: 42 } }),
      );

      expect((await postExpectingError()).fieldErrors).toEqual({ voltage: "must not be null" });
    });

    it("reads a bare {message} body (e.g. from a proxy) as a plain message, not a field error", async () => {
      stubFetchResponse(502, JSON.stringify({ message: "Upstream timed out" }), "Bad Gateway");

      const error = await postExpectingError();
      expect(error.status).toBe(502);
      expect(error.message).toBe("Upstream timed out");
      expect(error.fieldErrors).toBeUndefined();
    });
  });

  describe("legacy shapes", () => {
    it('reads {"error": message}', async () => {
      stubFetchResponse(400, JSON.stringify({ error: "wattageInput must be positive for DIRECT_WATTAGE mode" }));

      const error = await postExpectingError();
      expect(error.message).toBe("wattageInput must be positive for DIRECT_WATTAGE mode");
      expect(error.fieldErrors).toBeUndefined();
    });

    it("reads a flat field -> message map", async () => {
      stubFetchResponse(400, JSON.stringify({ currentAmps: "must be greater than 0" }));

      const error = await postExpectingError();
      expect(error.message).toBe("Validation failed");
      expect(error.fieldErrors).toEqual({ currentAmps: "must be greater than 0" });
    });
  });

  describe("unparseable bodies", () => {
    it("falls back to statusText for a non-JSON body", async () => {
      stubFetchResponse(500, "<html>Internal Server Error</html>", "Internal Server Error");

      const error = await postExpectingError();
      expect(error.status).toBe(500);
      expect(error.message).toBe("Internal Server Error");
    });

    it("falls back to a generic message when there is no statusText either", async () => {
      stubFetchResponse(500, "not json");

      expect((await postExpectingError()).message).toBe("Request failed");
    });

    it.each([["[]"], ["null"], ['"a string"']])("falls back for a non-object JSON body %s", async (body) => {
      stubFetchResponse(400, body, "Bad Request");

      const error = await postExpectingError();
      expect(error.message).toBe("Bad Request");
      expect(error.fieldErrors).toBeUndefined();
    });
  });
});

describe("isGenericValidationMessage", () => {
  it("recognizes the backend's and the legacy placeholder messages", () => {
    expect(isGenericValidationMessage("Request validation failed")).toBe(true);
    expect(isGenericValidationMessage("Validation failed")).toBe(true);
  });

  it("rejects real messages", () => {
    expect(isGenericValidationMessage("For FIXTURE_UNIT: totalFixtureUnits and systemType are required.")).toBe(false);
  });
});
