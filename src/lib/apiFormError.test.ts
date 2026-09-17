import { describe, expect, it } from "vitest";
import { ApiError } from "./api-client";
import { UNEXPECTED_ERROR_MESSAGE, asSentence, humanizeFieldName, resolveApiFormError } from "./apiFormError";

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
  ])("%s -> %s", (field, expected) => {
    expect(humanizeFieldName(field)).toBe(expected);
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
