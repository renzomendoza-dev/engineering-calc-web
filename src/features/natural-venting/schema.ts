import { z } from "zod";
import { optionalNumber, requiredNumber } from "@/lib/zodHelpers";
import { FIRE_CASE_KINDS } from "./types";

/**
 * One schema for the whole multi-step input. Steps validate subsets of it (see STEP_FIELDS), so
 * moving between steps never revalidates fields the user hasn't reached yet.
 *
 * FORM-ONLY fields (the API doesn't take them; request.ts drops them): the project name, each
 * zone's and fire case's `key` (a stable handle, so renaming a zone doesn't orphan the fire cases
 * placed in it), `inletMode` and `diameterSource` (which of several alternative fields is sent).
 *
 * The rules below mirror the ones calc-core enforces so the obvious mistakes show before a
 * request goes out. calc-core stays the authority.
 */
const positive = (typeMessage = "Must be a number") =>
  z.coerce.number(typeMessage).positive("Must be positive");
const nonNegative = () => z.coerce.number("Must be a number").min(0, "Cannot be negative");
const coefficient = (typeMessage = "Must be a number") =>
  z.coerce.number(typeMessage).gt(0, "Must be above 0").max(1, "Cannot exceed 1");

export const INLET_MODES = ["none", "ratio", "area"] as const;
export type InletMode = (typeof INLET_MODES)[number];

export const DIAMETER_SOURCES = ["unitHrr", "diameter", "area"] as const;
export type DiameterSource = (typeof DIAMETER_SOURCES)[number];

const zoneSchema = z
  .object({
    key: z.string().min(1),
    name: z.string().trim().min(1, "Required"),
    ceilingHeight: requiredNumber(positive("Required")),
    ventCentreHeight: optionalNumber(positive()),
    curtainDepth: optionalNumber(positive()),
    zoneLength: optionalNumber(positive()),
    zoneWidth: optionalNumber(positive()),
    ventDischargeCoefficient: requiredNumber(coefficient("Required")),
    ventCount: optionalNumber(z.coerce.number("Must be a number").int("Must be a whole number").positive("Must be positive")),
    ventTotalArea: optionalNumber(positive()),
    ventUnitLength: optionalNumber(positive()),
    ventUnitWidth: optionalNumber(positive()),
    ventSpacing: optionalNumber(positive()),
    ventToWallDistance: optionalNumber(positive()),
    inletDischargeCoefficient: optionalNumber(coefficient()),
    inletMode: z.enum(INLET_MODES),
    inletAreaRatio: optionalNumber(positive()),
    inletNetArea: optionalNumber(positive()),
    maxLayerTemperatureRise: optionalNumber(positive()),
    maxFloorRadiantFlux: optionalNumber(positive()),
    aisleWidth: optionalNumber(positive()),
  })
  .superRefine((zone, ctx) => {
    if (zone.ventCentreHeight !== undefined && zone.ceilingHeight !== undefined) {
      if (zone.ventCentreHeight > zone.ceilingHeight) {
        ctx.addIssue({ code: "custom", path: ["ventCentreHeight"], message: "Cannot be above the ceiling" });
      }
    }
    if (zone.curtainDepth !== undefined && zone.ceilingHeight !== undefined) {
      if (zone.curtainDepth > zone.ceilingHeight) {
        ctx.addIssue({ code: "custom", path: ["curtainDepth"], message: "Cannot exceed the ceiling height" });
      }
    }
    if (zone.inletMode === "ratio" && zone.inletAreaRatio === undefined) {
      ctx.addIssue({ code: "custom", path: ["inletAreaRatio"], message: "Required" });
    }
    if (zone.inletMode === "area" && zone.inletNetArea === undefined) {
      ctx.addIssue({ code: "custom", path: ["inletNetArea"], message: "Required" });
    }
  });

const fireCaseSchema = z
  .object({
    key: z.string().min(1),
    name: z.string().trim().min(1, "Required"),
    zoneKey: z.string().min(1, "Choose a zone"),
    kind: z.enum(FIRE_CASE_KINDS),
    steadyHeatReleaseRate: optionalNumber(positive()),
    growthTime: optionalNumber(positive()),
    detectionTime: optionalNumber(nonNegative()),
    designInterval: optionalNumber(positive()),
    maxHeatReleaseRate: optionalNumber(positive()),
    diameterSource: z.enum(DIAMETER_SOURCES),
    fireDiameter: optionalNumber(positive()),
    fireArea: optionalNumber(positive()),
    unitHeatReleaseRate: optionalNumber(positive()),
    largestFireDimension: optionalNumber(positive()),
    fireBaseHeight: optionalNumber(nonNegative()),
    smokeLayerHeight: requiredNumber(positive("Required")),
  })
  .superRefine((fire, ctx) => {
    const required = (field: keyof typeof fire) =>
      ctx.addIssue({ code: "custom", path: [field], message: "Required" });

    if (fire.kind === "STEADY") {
      if (fire.steadyHeatReleaseRate === undefined) required("steadyHeatReleaseRate");
    } else {
      if (fire.growthTime === undefined) required("growthTime");
      if (fire.detectionTime === undefined) required("detectionTime");
      if (fire.designInterval === undefined) required("designInterval");
    }
    if (fire.diameterSource === "unitHrr" && fire.unitHeatReleaseRate === undefined) {
      required("unitHeatReleaseRate");
    }
    if (fire.diameterSource === "diameter" && fire.fireDiameter === undefined) required("fireDiameter");
    if (fire.diameterSource === "area" && fire.fireArea === undefined) required("fireArea");
    if (
      fire.smokeLayerHeight !== undefined &&
      fire.fireBaseHeight !== undefined &&
      fire.smokeLayerHeight <= fire.fireBaseHeight
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["smokeLayerHeight"],
        message: "Must be above the base of the fire",
      });
    }
  });

export const naturalVentingSchema = z
  .object({
    projectName: z.string(), // FORM-ONLY
    ambientTemperature: requiredNumber(
      z.coerce.number("Required").gt(-273.15, "Must be above absolute zero"),
    ),
    ambientDensity: optionalNumber(positive()),
    specificHeat: optionalNumber(positive()),
    layerEnergyFraction: optionalNumber(coefficient()),
    growthConstant: optionalNumber(positive()),
    zones: z.array(zoneSchema).min(1, "Add at least one zone"),
    fireCases: z.array(fireCaseSchema).min(1, "Add at least one fire case"),
  })
  .superRefine((input, ctx) => {
    const zoneNames = new Map<string, number>();
    input.zones.forEach((zone, index) => {
      const name = zone.name.trim();
      if (zoneNames.has(name)) {
        ctx.addIssue({
          code: "custom",
          path: ["zones", index, "name"],
          message: "Another zone already has this name",
        });
      }
      zoneNames.set(name, index);
    });

    const caseNames = new Set<string>();
    input.fireCases.forEach((fire, index) => {
      const name = fire.name.trim();
      if (caseNames.has(name)) {
        ctx.addIssue({
          code: "custom",
          path: ["fireCases", index, "name"],
          message: "Another fire case already has this name",
        });
      }
      caseNames.add(name);

      const zone = input.zones.find((candidate) => candidate.key === fire.zoneKey);
      if (!zone) {
        ctx.addIssue({
          code: "custom",
          path: ["fireCases", index, "zoneKey"],
          message: "Choose one of the zones",
        });
        return;
      }
      if (fire.smokeLayerHeight === undefined || zone.ceilingHeight === undefined) return;
      if (fire.smokeLayerHeight > zone.ceilingHeight) {
        ctx.addIssue({
          code: "custom",
          path: ["fireCases", index, "smokeLayerHeight"],
          message: "Cannot be above the ceiling of its zone",
        });
        return;
      }
      const ventCentre = zone.ventCentreHeight ?? zone.ceilingHeight;
      if (fire.smokeLayerHeight >= ventCentre) {
        ctx.addIssue({
          code: "custom",
          path: ["fireCases", index, "smokeLayerHeight"],
          message: "Must be below the middle of the vents, or the layer has no depth",
        });
      }
    });
  });

export type NaturalVentingFormInput = z.input<typeof naturalVentingSchema>;
export type NaturalVentingFormValues = z.output<typeof naturalVentingSchema>;
export type ZoneFormInput = NaturalVentingFormInput["zones"][number];
export type FireCaseFormInput = NaturalVentingFormInput["fireCases"][number];

export const STEPS = ["conditions", "zones", "fires", "results"] as const;
export type StepId = (typeof STEPS)[number];

export const STEP_LABELS: Record<StepId, string> = {
  conditions: "Project and conditions",
  zones: "Curtained areas",
  fires: "Design fires",
  results: "Results",
};

/** The fields each step owns: moving past a step validates exactly these. */
export const STEP_FIELDS: Record<StepId, string[]> = {
  conditions: [
    "projectName",
    "ambientTemperature",
    "ambientDensity",
    "specificHeat",
    "layerEnergyFraction",
    "growthConstant",
  ],
  zones: ["zones"],
  fires: ["fireCases"],
  results: [],
};
