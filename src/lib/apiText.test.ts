import { describe, expect, it } from "vitest";
import { formatApiText } from "./apiText";

describe("formatApiText", () => {
  it("renders calc-core's spaced double hyphen as a dash", () => {
    // Real messages from calc-core.
    expect(formatApiText("No duct size satisfies these inputs -- try adjusting the target friction rate.")).toBe(
      "No duct size satisfies these inputs — try adjusting the target friction rate.",
    );
    expect(
      formatApiText("Fitting equivalent length for ELBOW_90_STANDARD is reference data tagged 'verify' -- confirm it"),
    ).toBe("Fitting equivalent length for ELBOW_90_STANDARD is reference data tagged 'verify' — confirm it");
  });

  it("handles more than one in a message", () => {
    expect(formatApiText("a -- b -- c")).toBe("a — b — c");
  });

  it("leaves an unspaced double hyphen alone, so a flag or range survives", () => {
    expect(formatApiText("pass --require to fail instead")).toBe("pass --require to fail instead");
    expect(formatApiText("range 10--20")).toBe("range 10--20");
  });

  it("changes nothing else about the message", () => {
    const message = "No impedance data for conductor size 0.75";
    expect(formatApiText(message)).toBe(message);
    expect(formatApiText("")).toBe("");
  });
});
