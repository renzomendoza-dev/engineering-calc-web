import { describe, expect, it } from "vitest";
import { DEFAULT_STANDPIPE_FORM, newFdcLine, newSegment } from "./defaults";
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

  it("sends the laterals, levels, manual system and inlet size for Class I and III", () => {
    const form = baseForm();
    form.standpipeClass = "CLASS_I";
    form.singleConnectionLaterals = "2";
    form.risersEndAtDifferentLevels = true;
    form.manualSystem = true;
    form.fireDepartmentConnectionInletSize = "FOUR_INCH";

    const request = toStandpipeRequest(parse(form));

    expect(request.singleConnectionLaterals).toBe(2);
    expect(request.risersEndAtDifferentLevels).toBe(true);
    expect(request.manualSystem).toBe(true);
    expect(request.fireDepartmentConnectionInletSize).toBe("FOUR_INCH");
  });

  it("leaves the laterals, levels and manual system out of a Class II request, which has none of them", () => {
    const form = baseForm();
    form.singleConnectionLaterals = "2";
    form.risersEndAtDifferentLevels = true;
    form.manualSystem = true;

    const json = JSON.parse(JSON.stringify(toStandpipeRequest(parse(form))));

    expect(json).not.toHaveProperty("singleConnectionLaterals");
    expect(json).not.toHaveProperty("risersEndAtDifferentLevels");
    expect(json).not.toHaveProperty("manualSystem");
    expect(json.fireDepartmentConnectionInletSize).toBe("TWO_AND_HALF_INCH");
  });

  it("sends another standpipe's connection point only where no hose connection takes the node", () => {
    const form = baseForm();
    form.segments[0] = { ...form.segments[0], otherStandpipeConnection: true };
    form.segments[1] = { ...form.segments[1], otherStandpipeConnection: true, flowAddedGpm: "250" };

    const [hose, node] = toStandpipeRequest(parse(form)).segments;

    expect(hose.otherStandpipeConnection).toBeUndefined();
    expect(node.otherStandpipeConnection).toBe(true);
    expect(node.flowAddedGpm).toBe(250);
    const plain = JSON.parse(JSON.stringify(toStandpipeRequest(parse(baseForm())).segments[1]));
    expect(plain).not.toHaveProperty("otherStandpipeConnection");
  });

  it("sends the static pressure and the height of the lowest hose connection only when given", () => {
    const form = baseForm();
    expect(JSON.parse(JSON.stringify(toStandpipeRequest(parse(form))))).not.toHaveProperty("supplyStaticPressurePsi");
    expect(JSON.parse(JSON.stringify(toStandpipeRequest(parse(form))))).not.toHaveProperty("lowestHoseConnectionHeightFt");

    form.supplyStaticPressurePsi = "180";
    form.lowestHoseConnectionHeightFt = "-12";
    const request = toStandpipeRequest(parse(form));

    expect(request.supplyStaticPressurePsi).toBe(180);
    expect(request.lowestHoseConnectionHeightFt).toBe(-12);
  });

  it("sends each fire department connection as one run of plain pipe from the system out", () => {
    const form = baseForm();
    form.standpipeClass = "CLASS_I";
    form.fireDepartmentConnections = [
      newFdcLine([], {
        label: " Street ",
        flowGpm: "250",
        inlets: "2",
        nominalSize: "4",
        pipeLengthFt: "50",
        elevationRiseFt: "3",
        fittings: [{ fittingType: "GATE_VALVE", quantity: "1", explicitEquivalentLengthFt: "" }],
      }),
    ];

    const [line] = toStandpipeRequest(parse(form)).fireDepartmentConnections ?? [];

    expect(line.label).toBe("Street");
    expect(line.flowGpm).toBe(250);
    expect(line.inlets).toBe(2);
    expect(line.segments).toHaveLength(1);
    expect(line.segments[0]).toMatchObject({
      label: "Street pipe",
      role: "OTHER",
      pipeMaterial: "BI",
      nominalSize: "4",
      cFactor: 120,
      pipeLengthFt: 50,
      elevationRiseFt: 3,
    });
    expect(line.segments[0].flowAddedGpm).toBeUndefined();
    expect(line.segments[0].hoseConnectionSize).toBeUndefined();
    expect(line.segments[0].fittings).toEqual([
      { fittingType: "GATE_VALVE", quantity: 1, explicitEquivalentLengthFt: undefined },
    ]);
  });

  it("sends no fire department connections when none are given, and none for a Class II system", () => {
    const form = baseForm();
    form.standpipeClass = "CLASS_I";
    expect(JSON.parse(JSON.stringify(toStandpipeRequest(parse(form))))).not.toHaveProperty("fireDepartmentConnections");

    form.fireDepartmentConnections = [newFdcLine([], { label: "Street", nominalSize: "4", pipeLengthFt: "50" })];
    form.standpipeClass = "CLASS_II";
    expect(toStandpipeRequest(parse(form)).fireDepartmentConnections).toBeUndefined();

    const withoutFlow = { ...form, standpipeClass: "CLASS_III" as const };
    const request = toStandpipeRequest(parse(withoutFlow));
    expect(JSON.parse(JSON.stringify(request.fireDepartmentConnections))[0]).not.toHaveProperty("flowGpm");
    expect(JSON.parse(JSON.stringify(request.fireDepartmentConnections))[0]).not.toHaveProperty("inlets");
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
