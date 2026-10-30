import { describe, expect, it } from "vitest";
import { DEFAULT_NATURAL_VENTING_FORM, newFireCase, newZone } from "./defaults";
import { naturalVentingSchema, type NaturalVentingFormInput } from "./schema";

/** A form that passes: the Annex D retail storage building, one zone and one fire. */
function validForm(): NaturalVentingFormInput {
  const zone = {
    ...newZone([]),
    name: "Retail storage",
    ceilingHeight: "9.1",
    ventDischargeCoefficient: "0.61",
    inletMode: "ratio" as const,
    inletAreaRatio: "1.5",
  };
  const fire = {
    ...newFireCase([], zone.key),
    name: "Case 1",
    steadyHeatReleaseRate: "100000",
    unitHeatReleaseRate: "2136",
    fireBaseHeight: "0.5",
    smokeLayerHeight: "3",
  };
  return {
    ...DEFAULT_NATURAL_VENTING_FORM,
    ambientTemperature: "21",
    zones: [zone],
    fireCases: [fire],
  };
}

function issuePaths(input: NaturalVentingFormInput): string[] {
  const result = naturalVentingSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("naturalVentingSchema", () => {
  it("accepts a complete form, and reads blank optional fields as not given", () => {
    const result = naturalVentingSchema.safeParse(validForm());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.growthConstant).toBeUndefined();
      expect(result.data.zones[0].curtainDepth).toBeUndefined();
      expect(result.data.zones[0].ceilingHeight).toBe(9.1);
    }
  });

  it("does not calculate on the blank starting form", () => {
    expect(naturalVentingSchema.safeParse(DEFAULT_NATURAL_VENTING_FORM).success).toBe(false);
  });

  it("requires what each way of describing the inlet needs", () => {
    const form = validForm();
    form.zones[0] = { ...form.zones[0], inletAreaRatio: "" };
    expect(issuePaths(form)).toContain("zones.0.inletAreaRatio");

    form.zones[0] = { ...form.zones[0], inletMode: "area", inletNetArea: "" };
    expect(issuePaths(form)).toContain("zones.0.inletNetArea");

    form.zones[0] = { ...form.zones[0], inletMode: "none" };
    expect(issuePaths(form)).toEqual([]);
  });

  it("requires the fields of the chosen heat release rate and size of fire", () => {
    const form = validForm();
    form.fireCases[0] = { ...form.fireCases[0], kind: "GROWING" };
    expect(issuePaths(form)).toEqual(
      expect.arrayContaining(["fireCases.0.growthTime", "fireCases.0.detectionTime", "fireCases.0.designInterval"]),
    );

    form.fireCases[0] = { ...form.fireCases[0], kind: "STEADY", diameterSource: "diameter" };
    expect(issuePaths(form)).toContain("fireCases.0.fireDiameter");
  });

  it("keeps the smoke layer between the base of the fire and the vents", () => {
    const form = validForm();

    form.fireCases[0] = { ...form.fireCases[0], smokeLayerHeight: "0.4" };
    expect(issuePaths(form)).toContain("fireCases.0.smokeLayerHeight");

    form.fireCases[0] = { ...form.fireCases[0], smokeLayerHeight: "9.5" };
    expect(issuePaths(form)).toContain("fireCases.0.smokeLayerHeight");

    form.zones[0] = { ...form.zones[0], ventCentreHeight: "6" };
    form.fireCases[0] = { ...form.fireCases[0], smokeLayerHeight: "6" };
    expect(issuePaths(form)).toContain("fireCases.0.smokeLayerHeight");
  });

  it("rejects repeated names and a fire case in a zone that does not exist", () => {
    const form = validForm();
    const second = { ...form.zones[0], key: "zone-2" };
    form.zones = [...form.zones, second];
    expect(issuePaths(form)).toContain("zones.1.name");

    const repeated = validForm();
    repeated.fireCases = [
      ...repeated.fireCases,
      { ...repeated.fireCases[0], key: "fire-2" },
    ];
    expect(issuePaths(repeated)).toContain("fireCases.1.name");

    const lost = validForm();
    lost.fireCases[0] = { ...lost.fireCases[0], zoneKey: "zone-9" };
    expect(issuePaths(lost)).toContain("fireCases.0.zoneKey");
  });

  it("keeps coefficients in (0, 1] and the curtains within the ceiling", () => {
    const form = validForm();
    form.zones[0] = { ...form.zones[0], ventDischargeCoefficient: "1.5", curtainDepth: "10" };

    expect(issuePaths(form)).toEqual(
      expect.arrayContaining(["zones.0.ventDischargeCoefficient", "zones.0.curtainDepth"]),
    );
  });
});
