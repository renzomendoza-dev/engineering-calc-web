import { describe, expect, it } from "vitest";
import { ApiError } from "./api-client";
import {
  UNEXPECTED_ERROR_MESSAGE,
  asSentence,
  humanizeFieldName,
  resolveApiFormError,
  toFormFieldPath,
} from "./apiFormError";

const everyFieldInline = () => true;
const noFieldInline = () => false;

describe("resolveApiFormError", () => {
  it("shows a non-ApiError as the generic unexpected-error banner", () => {
    expect(resolveApiFormError(new TypeError("boom"), everyFieldInline)).toEqual({
      inlineErrors: {},
      banner: UNEXPECTED_ERROR_MESSAGE,
    });
  });

  it("shows a calculation error's message in the banner", () => {
    const err = new ApiError(400, "No duct size satisfies these inputs.");

    expect(resolveApiFormError(err, everyFieldInline)).toEqual({
      inlineErrors: {},
      banner: "No duct size satisfies these inputs.",
    });
  });

  it("puts visible field errors inline with no redundant generic banner", () => {
    const err = new ApiError(400, "Request validation failed", { wattageInput: "must be greater than 0" });

    expect(resolveApiFormError(err, everyFieldInline)).toEqual({
      inlineErrors: { wattageInput: "must be greater than 0" },
      banner: null,
    });
  });

  it("names a field in the banner when it can't be shown inline (hidden or unknown to the form)", () => {
    const err = new ApiError(400, "Request validation failed", { totalOperatingHours: "must be greater than 0" });

    expect(resolveApiFormError(err, noFieldInline)).toEqual({
      inlineErrors: {},
      banner: "Total operating hours must be greater than 0.",
    });
  });

  it("splits a mix of visible and hidden field errors", () => {
    const err = new ApiError(400, "Request validation failed", {
      voltage: "must not be null",
      totalOperatingHours: "must be greater than 0",
    });

    expect(resolveApiFormError(err, (field) => field === "voltage")).toEqual({
      inlineErrors: { voltage: "must not be null" },
      banner: "Total operating hours must be greater than 0.",
    });
  });

  it("keeps a meaningful message (a class-level rule) alongside field errors", () => {
    const err = new ApiError(400, "For FIXTURE_UNIT: totalFixtureUnits and systemType are required.", {
      storageDurationHours: "must be greater than 0",
    });

    expect(resolveApiFormError(err, noFieldInline).banner).toBe(
      "For FIXTURE_UNIT: totalFixtureUnits and systemType are required. Storage duration hours must be greater than 0.",
    );
  });

  it("treats the legacy client-assigned placeholder the same as the backend's", () => {
    const err = new ApiError(400, "Validation failed", { currentAmps: "must be greater than 0" });

    expect(resolveApiFormError(err, everyFieldInline).banner).toBeNull();
  });

  it("converts Spring list paths so list-item errors can go inline", () => {
    const err = new ApiError(400, "Request validation failed", {
      "conductors[0].quantity": "must be greater than or equal to 1",
    });
    const seen: string[] = [];

    const resolved = resolveApiFormError(err, (path) => {
      seen.push(path);
      return true;
    });
    expect(seen).toEqual(["conductors.0.quantity"]);
    expect(resolved).toEqual({
      inlineErrors: { "conductors.0.quantity": "must be greater than or equal to 1" },
      banner: null,
    });
  });

  it("names a list item readably when it can't be shown inline", () => {
    const err = new ApiError(400, "Request validation failed", {
      "suctionSegments[1].lengthMeters": "must be greater than 0",
    });

    expect(resolveApiFormError(err, noFieldInline).banner).toBe("Suction segments #2 length meters must be greater than 0.");
  });

  it("still shows a generic message when there are no field errors to explain it", () => {
    const err = new ApiError(400, "Request validation failed");

    expect(resolveApiFormError(err, everyFieldInline).banner).toBe("Request validation failed.");
  });
});

describe("humanizeFieldName", () => {
  it.each([
    ["totalOperatingHours", "Total operating hours"],
    ["voltage", "Voltage"],
    ["airFlowLps", "Air flow lps"],
    ["fire2Hazard", "Fire2 hazard"],
    ["conductors.0.quantity", "Conductors #1 quantity"],
    ["curvePoints[2].flowGpm", "Curve points #3 flow gpm"],
  ])("%s -> %s", (field, expected) => {
    expect(humanizeFieldName(field)).toBe(expected);
  });
});

describe("toFormFieldPath", () => {
  it.each([
    ["conductors[0].quantity", "conductors.0.quantity"],
    ["suctionSegments[12].lengthMeters", "suctionSegments.12.lengthMeters"],
    ["a[0].b[1].c", "a.0.b.1.c"],
    ["voltage", "voltage"],
  ])("%s -> %s", (field, expected) => {
    expect(toFormFieldPath(field)).toBe(expected);
  });
});

describe("asSentence", () => {
  it.each([
    ["must be greater than 0", "must be greater than 0."],
    ["Already a sentence.", "Already a sentence."],
    ["Really?", "Really?"],
    ["  padded  ", "padded."],
  ])("%j -> %j", (input, expected) => {
    expect(asSentence(input)).toBe(expected);
  });
});
