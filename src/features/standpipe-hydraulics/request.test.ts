import { describe, expect, it } from "vitest";
import { DEFAULT_STANDPIPE_FORM, newSegment } from "./defaults";
import { toStandpipeRequest } from "./request";
import { EXPLICIT_FITTING, standpipeHydraulicSchema, type StandpipeFormInput } from "./schema";

function parse(input: StandpipeFormInput) {
  return standpipeHydraulicSchema.parse(input);
}

function baseForm(): StandpipeFormInput {
  const hose = newSegment([], {
    label: " A ",
    role: "HOSE_PIPING",
    hoseConnectionSize: "ONE_AND_HALF_INCH",
    flowAddedGpm: "100",
    nominalSize: "1-1/2",
    pipeLengthFt: "30",
    fittings: [{ fittingType: "ANGLE_HOSE_VALVE", quantity: "1", explicitEquivalentLengthFt: "9" }],
  });
  const riser = newSegment([hose], {
    label: "Riser",
    nominalSize: "3",
    pipeLengthFt: "400",
    elevationRiseFt: "5",
    fittings: [{ fittingType: EXPLICIT_FITTING, quantity: "2", explicitEquivalentLengthFt: "7" }],
  });
  return { ...DEFAULT_STANDPIPE_FORM, standpipeClass: "CLASS_II", segments: [hose, riser] };
}

describe("toStandpipeRequest", () => {
  it("sends numbers, trims names and drops a hose connection a segment does not have", () => {
    const request = toStandpipeRequest(parse(baseForm()));

    expect(request.standpipeClass).toBe("CLASS_II");
    expect(request.segments[0].label).toBe("A");
    expect(request.segments[0].hoseConnectionSize).toBe("ONE_AND_HALF_INCH");
    expect(request.segments[0].flowAddedGpm).toBe(100);
    expect(request.segments[1].hoseConnectionSize).toBeUndefined();
    expect(request.segments[1].pipeLengthFt).toBe(400);
    expect(request.segments[1].elevationRiseFt).toBe(5);
  });

  it("sends a chart fitting by type only, and an explicit one by length only", () => {
    const request = toStandpipeRequest(parse(baseForm()));

    expect(request.segments[0].fittings).toEqual([
      { fittingType: "ANGLE_HOSE_VALVE", quantity: 1, explicitEquivalentLengthFt: undefined },
    ]);
    expect(request.segments[1].fittings).toEqual([
      { fittingType: undefined, quantity: 2, explicitEquivalentLengthFt: 7 },
    ]);
  });

  it("sends nothing for what was left blank, so the API's defaults apply", () => {
    const json = JSON.parse(JSON.stringify(toStandpipeRequest(parse(baseForm()))));

    expect(json).not.toHaveProperty("supplyDurationMinutes");
    expect(json).not.toHaveProperty("flowAddedAtSupplyGpm");
    expect(json).not.toHaveProperty("fireDepartmentConnectionInlets");
    expect(json).not.toHaveProperty("sprinklerDemandGpm");
    expect(json.additionalStandpipes).toBe(0);
    expect(json.floorAreaOver80000SqFt).toBe(false);
  });

  it("leaves the sprinkler demand and hazard out unless the building has the sprinklers that read them", () => {
    const form = baseForm();
    form.sprinklerDemandGpm = "300";
    form.sprinklerHazard = "LIGHT";

    form.sprinklerProtection = "NONE";
    const none = toStandpipeRequest(parse(form));
    expect(none.sprinklerDemandGpm).toBeUndefined();
    expect(none.sprinklerHazard).toBeUndefined();

    form.sprinklerProtection = "FULL";
    const full = toStandpipeRequest(parse(form));
    expect(full.sprinklerDemandGpm).toBe(300);
    expect(full.sprinklerHazard).toBeUndefined();

    form.sprinklerProtection = "PARTIAL";
    const partial = toStandpipeRequest(parse(form));
    expect(partial.sprinklerDemandGpm).toBe(300);
    expect(partial.sprinklerHazard).toBe("LIGHT");
  });
});
