import { z } from "zod";
import { FLOW_RATE_UNITS } from "@/lib/flowRateUnit";
import { pipeSegmentSchema } from "@/lib/pipeSegment";
import { FLUIDS } from "@/features/pipe-pressure-loss/types";
import { SUCTION_CONDITIONS } from "./types";

export { FLOW_RATE_UNITS };

const FLUID_KEYS = FLUIDS.map((f) => f.key) as [string, ...string[]];

const pipeSegmentListSchema = z.array(pipeSegmentSchema);

/**
 * Mirrors calc-api's PumpTDHRequest.isSuctionFieldsValid(): FLOODED requires
 * staticSuctionHeadFloodedMeters, LIFT requires staticSuctionLiftMeters. suctionSegments and
 * dischargeSegments deliberately have no `.min()` — an empty list is valid (e.g. no suction
 * piping when the pump sits directly in a flooded wet well).
 */
export const tdhSchema = z
  .object({
    fluidKey: z.enum(FLUID_KEYS),
    fluidTemperatureCelsius: z.coerce.number(),
    flowRateValue: z.coerce.number().positive("Must be positive"),
    flowRateUnit: z.enum(FLOW_RATE_UNITS),

    suctionCondition: z.enum(SUCTION_CONDITIONS),
    staticSuctionHeadFloodedMeters: z.coerce.number().optional(),
    staticSuctionLiftMeters: z.coerce.number().optional(),
    suctionSegments: pipeSegmentListSchema,

    staticDischargeElevationMeters: z.coerce.number(),
    requiredResidualPressureKpa: z.coerce.number().min(0, "Cannot be negative"),
    dischargeSegments: pipeSegmentListSchema,

    includeVelocityHead: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.suctionCondition === "FLOODED") {
      if (data.staticSuctionHeadFloodedMeters === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["staticSuctionHeadFloodedMeters"],
          message: "Required for flooded suction",
        });
      }
    } else if (data.staticSuctionLiftMeters === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["staticSuctionLiftMeters"],
        message: "Required for suction lift",
      });
    }
  });

export type TdhFormInput = z.input<typeof tdhSchema>;
export type TdhFormValues = z.output<typeof tdhSchema>;
