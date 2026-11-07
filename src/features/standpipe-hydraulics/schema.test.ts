import { describe, expect, it } from "vitest";
import { DEFAULT_STANDPIPE_FORM, newFdcLine, newFitting, newSegment } from "./defaults";
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

  it("takes the laterals as a whole number from zero and the inlet size from the list", () => {
    const negative = { ...validForm(), singleConnectionLaterals: "-1" };
    const fractional = { ...validForm(), singleConnectionLaterals: "1.5" };
    const blank = { ...validForm(), singleConnectionLaterals: "" };
    const badSize = { ...validForm(), fireDepartmentConnectionInletSize: "SIX_INCH" as never };

    expect(issuePaths(negative)).toContain("singleConnectionLaterals");
    expect(issuePaths(fractional)).toContain("singleConnectionLaterals");
    expect(issuePaths(blank)).toContain("singleConnectionLaterals");
    expect(issuePaths(badSize)).toContain("fireDepartmentConnectionInletSize");
    expect(issuePaths({ ...validForm(), singleConnectionLaterals: "3" })).toEqual([]);
  });

  it("wants a flow wherever another standpipe's connection point is marked, and ignores the mark behind a hose connection", () => {
    const form = validForm();
    form.segments[1] = { ...form.segments[1], otherStandpipeConnection: true, flowAddedGpm: "" };
    expect(issuePaths(form)).toContain("segments.1.flowAddedGpm");

    form.segments[1] = { ...form.segments[1], flowAddedGpm: "250" };
    expect(issuePaths(form)).toEqual([]);

    // The first segment has a hose connection with its own flow, so a mark left on it asks for nothing more.
    form.segments[0] = { ...form.segments[0], otherStandpipeConnection: true };
    expect(issuePaths(form)).toEqual([]);
  });

  it("takes the fire pump fields as optional numbers and a suction condition from the list", () => {
    const form = validForm();

    expect(issuePaths({ ...form, pumpSuctionCondition: "LIFT", pumpSuctionLiftFt: "8", pumpSafetyMarginPercent: "10" })).toEqual([]);
    expect(issuePaths({ ...form, pumpSuctionPressurePsi: "abc" })).toContain("pumpSuctionPressurePsi");
    expect(issuePaths({ ...form, pumpSafetyMarginPercent: "x" })).toContain("pumpSafetyMarginPercent");
    expect(issuePaths({ ...form, pumpSuctionCondition: "SIPHON" as never })).toContain("pumpSuctionCondition");
  });

  it("takes a positive static pressure, a height that may be negative, and wants the pressure for a height", () => {
    const form = validForm();

    expect(issuePaths({ ...form, supplyStaticPressurePsi: "180" })).toEqual([]);
    expect(issuePaths({ ...form, supplyStaticPressurePsi: "180", lowestHoseConnectionHeightFt: "-12" })).toEqual([]);
    expect(issuePaths({ ...form, supplyStaticPressurePsi: "0" })).toContain("supplyStaticPressurePsi");
    expect(issuePaths({ ...form, supplyStaticPressurePsi: "-5" })).toContain("supplyStaticPressurePsi");
    expect(issuePaths({ ...form, lowestHoseConnectionHeightFt: "10" })).toContain("supplyStaticPressurePsi");
    expect(issuePaths({ ...form, supplyStaticPressurePsi: "180", lowestHoseConnectionHeightFt: "abc" })).toContain(
      "lowestHoseConnectionHeightFt",
    );
  });

  it("accepts fire department connections, and asks for a name and a size for each", () => {
    const form = validForm();
    form.fireDepartmentConnections = [newFdcLine([], { label: "Street", nominalSize: "4", pipeLengthFt: "50" })];
    expect(issuePaths(form)).toEqual([]);

    form.fireDepartmentConnections = [newFdcLine([], { label: "", nominalSize: "", pipeLengthFt: "" })];
    expect(issuePaths(form)).toEqual(
      expect.arrayContaining([
        "fireDepartmentConnections.0.label",
        "fireDepartmentConnections.0.nominalSize",
        "fireDepartmentConnections.0.pipeLengthFt",
      ]),
    );
  });

  it("takes a positive flow and a whole number of inlets for a connection, both optional", () => {
    const form = validForm();
    const base = { label: "Street", nominalSize: "4", pipeLengthFt: "50" };

    form.fireDepartmentConnections = [newFdcLine([], { ...base, flowGpm: "-5", inlets: "1.5" })];
    expect(issuePaths(form)).toEqual(
      expect.arrayContaining(["fireDepartmentConnections.0.flowGpm", "fireDepartmentConnections.0.inlets"]),
    );

    form.fireDepartmentConnections = [newFdcLine([], { ...base, flowGpm: "250", inlets: "0" })];
    expect(issuePaths(form)).toEqual([]);
  });

  it("rejects a repeated connection name", () => {
    const form = validForm();
    const first = newFdcLine([], { label: "Street", nominalSize: "4", pipeLengthFt: "50" });
    const second = newFdcLine([first], { label: "Street", nominalSize: "4", pipeLengthFt: "20" });
    form.fireDepartmentConnections = [first, second];

    expect(issuePaths(form)).toContain("fireDepartmentConnections.1.label");
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
