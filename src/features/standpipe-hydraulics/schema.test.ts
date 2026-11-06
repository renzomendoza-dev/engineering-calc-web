import { describe, expect, it } from "vitest";
import { DEFAULT_STANDPIPE_FORM, newFitting, newSegment } from "./defaults";
import { EXPLICIT_FITTING, standpipeHydraulicSchema, type StandpipeFormInput } from "./schema";

/** The Carmona hose station: a Class II 1.5 in. connection at 100 gpm on a 3 in. riser. */
function validForm(): StandpipeFormInput {
  const hose = newSegment([], {
    label: "A",
    role: "HOSE_PIPING",
    hoseConnectionSize: "ONE_AND_HALF_INCH",
    flowAddedGpm: "100",
    nominalSize: "1-1/2",
    pipeLengthFt: "30",
  });
  const riser = newSegment([hose], { label: "Riser", nominalSize: "3", pipeLengthFt: "400", elevationRiseFt: "5" });
  return { ...DEFAULT_STANDPIPE_FORM, standpipeClass: "CLASS_II", segments: [hose, riser] };
}

function issuePaths(input: StandpipeFormInput): string[] {
  const result = standpipeHydraulicSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("standpipeHydraulicSchema", () => {
  it("accepts a complete form, and reads blank optional fields as not given", () => {
    const result = standpipeHydraulicSchema.safeParse(validForm());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supplyDurationMinutes).toBeUndefined();
      expect(result.data.segments[0].flowAddedGpm).toBe(100);
      expect(result.data.segments[1].cFactor).toBe(120);
    }
  });

  it("does not calculate on the blank starting form", () => {
    expect(standpipeHydraulicSchema.safeParse(DEFAULT_STANDPIPE_FORM).success).toBe(false);
  });

  it("asks for what a blank length, size or rise leaves out", () => {
    const form = validForm();
    form.segments[1] = { ...form.segments[1], nominalSize: "", pipeLengthFt: "" };

    expect(issuePaths(form)).toEqual(
      expect.arrayContaining(["segments.1.nominalSize", "segments.1.pipeLengthFt"]),
    );
  });

  it("wants a flow wherever a hose connection is, and at least one connection on the path", () => {
    const form = validForm();
    form.segments[0] = { ...form.segments[0], flowAddedGpm: "" };
    expect(issuePaths(form)).toContain("segments.0.flowAddedGpm");

    const none = validForm();
    none.segments[0] = { ...none.segments[0], hoseConnectionSize: "" };
    expect(issuePaths(none)).toContain("segments.0.hoseConnectionSize");
  });

  it("rejects a repeated segment name", () => {
    const form = validForm();
    form.segments[1] = { ...form.segments[1], label: "A" };

    expect(issuePaths(form)).toContain("segments.1.label");
  });

  it("wants the hazard of a partly sprinklered building once a sprinkler demand is given", () => {
    const form = validForm();
    form.sprinklerProtection = "PARTIAL";
    form.sprinklerDemandGpm = "300";

    expect(issuePaths(form)).toContain("sprinklerHazard");

    form.sprinklerHazard = "LIGHT";
    expect(issuePaths(form)).toEqual([]);
  });

  it("checks fittings: a type must be chosen, and an explicit one needs its length", () => {
    const form = validForm();
    form.segments[1] = { ...form.segments[1], fittings: [newFitting()] };
    expect(issuePaths(form)).toContain("segments.1.fittings.0.fittingType");

    form.segments[1] = {
      ...form.segments[1],
      fittings: [{ fittingType: EXPLICIT_FITTING, quantity: "2", explicitEquivalentLengthFt: "" }],
    };
    expect(issuePaths(form)).toContain("segments.1.fittings.0.explicitEquivalentLengthFt");

    form.segments[1] = {
      ...form.segments[1],
      fittings: [{ fittingType: "GATE_VALVE", quantity: "1", explicitEquivalentLengthFt: "" }],
    };
    expect(issuePaths(form)).toEqual([]);
  });
});
