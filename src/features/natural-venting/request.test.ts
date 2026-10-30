import { describe, expect, it } from "vitest";
import { DEFAULT_NATURAL_VENTING_FORM, newFireCase, newZone } from "./defaults";
import { toNaturalVentingRequest } from "./request";
import { naturalVentingSchema, type NaturalVentingFormInput } from "./schema";

function parse(input: NaturalVentingFormInput) {
  return naturalVentingSchema.parse(input);
}

function baseForm(): NaturalVentingFormInput {
  const zone = {
    ...newZone([]),
    name: " Warehouse ",
    ceilingHeight: "9.1",
    ventDischargeCoefficient: "0.61",
    inletMode: "ratio" as const,
    inletAreaRatio: "1.5",
    inletNetArea: "40",
  };
  const fire = {
    ...newFireCase([], zone.key),
    name: "Case 1",
    steadyHeatReleaseRate: "34400",
    growthTime: "150",
    unitHeatReleaseRate: "2136",
    fireDiameter: "9",
    smokeLayerHeight: "6",
  };
  return { ...DEFAULT_NATURAL_VENTING_FORM, ambientTemperature: "21", zones: [zone], fireCases: [fire] };
}

describe("toNaturalVentingRequest", () => {
  it("sends numbers, trims names and looks up each fire case's zone by name", () => {
    const request = toNaturalVentingRequest(parse(baseForm()));

    expect(request.ambientTemperature).toBe(21);
    expect(request.zones[0].name).toBe("Warehouse");
    expect(request.zones[0].ceilingHeight).toBe(9.1);
    expect(request.fireCases[0].zoneName).toBe("Warehouse");
    expect(request.fireCases[0].smokeLayerHeight).toBe(6);
  });

  it("sends only the chosen way of giving the inlet", () => {
    const byRatio = toNaturalVentingRequest(parse(baseForm()));
    expect(byRatio.zones[0].inletAreaRatio).toBe(1.5);
    expect(byRatio.zones[0].inletNetArea).toBeUndefined();

    const form = baseForm();
    form.zones[0] = { ...form.zones[0], inletMode: "area" };
    const byArea = toNaturalVentingRequest(parse(form));
    expect(byArea.zones[0].inletNetArea).toBe(40);
    expect(byArea.zones[0].inletAreaRatio).toBeUndefined();

    form.zones[0] = { ...form.zones[0], inletMode: "none" };
    const none = toNaturalVentingRequest(parse(form));
    expect(none.zones[0].inletNetArea).toBeUndefined();
    expect(none.zones[0].inletAreaRatio).toBeUndefined();
  });

  it("sends only the fields of the chosen kind of fire and size of fire", () => {
    const steady = toNaturalVentingRequest(parse(baseForm())).fireCases[0];
    expect(steady.kind).toBe("STEADY");
    expect(steady.steadyHeatReleaseRate).toBe(34400);
    expect(steady.growthTime).toBeUndefined();
    expect(steady.unitHeatReleaseRate).toBe(2136);
    expect(steady.fireDiameter).toBeUndefined();

    const form = baseForm();
    form.fireCases[0] = {
      ...form.fireCases[0],
      kind: "GROWING",
      detectionTime: "90",
      designInterval: "360",
      diameterSource: "diameter",
    };
    const growing = toNaturalVentingRequest(parse(form)).fireCases[0];
    expect(growing.kind).toBe("GROWING");
    expect(growing.steadyHeatReleaseRate).toBeUndefined();
    expect(growing.growthTime).toBe(150);
    expect(growing.detectionTime).toBe(90);
    expect(growing.designInterval).toBe(360);
    expect(growing.fireDiameter).toBe(9);
    expect(growing.unitHeatReleaseRate).toBeUndefined();
  });

  it("sends nothing for the assumptions left blank, so the API's defaults apply", () => {
    const request = toNaturalVentingRequest(parse(baseForm()));
    const json = JSON.parse(JSON.stringify(request));

    expect(json).not.toHaveProperty("growthConstant");
    expect(json).not.toHaveProperty("layerEnergyFraction");
    expect(json).not.toHaveProperty("specificHeat");
    expect(json).not.toHaveProperty("ambientDensity");
  });
});
