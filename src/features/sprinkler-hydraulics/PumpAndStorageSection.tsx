"use client";

import { NumberField } from "@/components/ui/NumberField";
import { ResultCard } from "@/components/ui/ResultCard";
import { SelectField } from "@/components/ui/SelectField";
import type { FireWaterStorageResponse } from "@/features/fire-water-storage/types";
import { HAZARD_CLASSIFICATION_LABELS } from "@/features/fire-water-storage/types";
import type { FirePumpCapacityResponse, FirePumpDemandResponse } from "@/features/firepump/types";
import { useLiveApiResult } from "@/hooks/useLiveApiResult";
import { formatApiText } from "@/lib/apiText";
import { formatFlow, formatPressure } from "./format";
import { UNITS } from "./labels";
import {
  buildPumpCapacityRequest,
  buildPumpDemandRequest,
  buildStorageRequest,
  hazardClassificationFor,
  pumpAddsNoPressure,
  type PumpStorageInputs,
} from "./pumpStorage";
import type { SprinklerForm } from "./stepProps";
import type { SprinklerHydraulicResponse } from "./types";

const PUMP_DEMAND_PATH = "/api/mechanical/firepump/demand";
const PUMP_CAPACITY_PATH = "/api/mechanical/firepump/capacity";
const STORAGE_PATH = "/api/mechanical/storage/fire";

const SUCTION_OPTIONS = [
  { value: "FLOODED", label: "Flooded — water arrives at the pump under pressure" },
  { value: "LIFT", label: "Suction lift — the water is below the pump" },
];

function gallons(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

interface PumpAndStorageSectionProps {
  form: SprinklerForm;
  /** The completed sprinkler calculation this is sized from. */
  result: SprinklerHydraulicResponse;
}

/**
 * Sizes a fire pump and a water tank for the demand just calculated, using the fire pump and fire
 * water storage calculators that already exist.
 *
 * It is a chain, each link the last one's answer: the sprinkler demand and required pressure go to
 * the pump demand calculator (rated flow and pressure, after the suction condition and any
 * margin); the rated flow goes to the capacity calculator (the standard NFPA 20 rating); that
 * rating, with the hazard's duration, goes to the fire water storage calculator (volume). Every
 * figure shown is one of those calculators' answers -- this only chooses what to hand each.
 *
 * The inputs it collects are the ones the sprinkler calculation can't know -- how the pump takes
 * its water, and the margins and duration chosen -- and are kept with the rest of the form.
 */
export function PumpAndStorageSection({ form, result }: PumpAndStorageSectionProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const inputs: PumpStorageInputs = {
    suctionCondition: (watch("pumpSuctionCondition") ??
      "FLOODED") as PumpStorageInputs["suctionCondition"],
    suctionPressurePsi: watch("pumpSuctionPressurePsi"),
    suctionLiftFt: watch("pumpSuctionLiftFt"),
    pumpSafetyMarginPercent: watch("pumpSafetyMarginPercent"),
    storageDurationMinutes: watch("storageDurationMinutes"),
    storageSafetyMarginPercent: watch("storageSafetyMarginPercent"),
  };
  const hazard = watch("hazard");
  const flooded = inputs.suctionCondition === "FLOODED";

  // A supply that already delivers what the system needs leaves nothing for a pump to add, which
  // the pump calculator would refuse; that is the answer, so it is said rather than sent.
  const noPumpNeeded = pumpAddsNoPressure(inputs, result.requiredPressureAtSupplyPsi);

  const demandRequest = buildPumpDemandRequest(
    inputs,
    result.totalDemandFlowGpm,
    result.requiredPressureAtSupplyPsi,
  );
  const demand = useLiveApiResult<FirePumpDemandResponse>(
    PUMP_DEMAND_PATH,
    demandRequest.request && !noPumpNeeded ? JSON.stringify(demandRequest.request) : null,
  );
  const capacity = useLiveApiResult<FirePumpCapacityResponse>(
    PUMP_CAPACITY_PATH,
    demand.result
      ? JSON.stringify(buildPumpCapacityRequest(demand.result.ratedFlowGpm))
      : noPumpNeeded
        ? // With no pump pressure to add, the storage is still sized for the flow the demand takes.
          JSON.stringify(buildPumpCapacityRequest(result.totalDemandFlowGpm))
        : null,
  );
  const storageRequest = capacity.result
    ? buildStorageRequest(inputs, hazard, capacity.result.standardFlowGpm)
    : { request: null, problems: [] as string[] };
  const storage = useLiveApiResult<FireWaterStorageResponse>(
    STORAGE_PATH,
    storageRequest.request ? JSON.stringify(storageRequest.request) : null,
  );

  const settling = demand.isStale || capacity.isStale || storage.isStale;
  const failure = [demand.error, capacity.error, storage.error].find((error) => error != null);
  const problems = [...demandRequest.problems, ...storageRequest.problems];

  const supplyPressure = result.availablePressureAtDemandPsi;
  const supplyMeetsDemand = result.passes === true;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Fire pump and water storage
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Sized for this demand — {formatFlow(result.totalDemandFlowGpm)} {UNITS.flow} at{" "}
          {formatPressure(result.requiredPressureAtSupplyPsi)} {UNITS.pressure} — by the fire pump
          and fire water storage calculators.{" "}
          {supplyMeetsDemand
            ? "The water supply meets this demand on its own, so a pump is not needed for pressure; these are the figures if you add one, or a tank, anyway."
            : result.passes === false
              ? "The water supply does not meet this demand, so a pump is needed."
              : "No water supply was given, so these are what a pump and tank have to deliver."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Pump suction"
          options={SUCTION_OPTIONS}
          error={errors.pumpSuctionCondition?.message}
          {...register("pumpSuctionCondition")}
        />
        {flooded ? (
          <div className="flex flex-col gap-1">
            <NumberField
              label="Pressure available at the pump suction"
              unit={UNITS.pressure}
              hint="What the supply or tank delivers to the pump inlet; 0 if none. It comes off the pressure the pump has to add."
              error={errors.pumpSuctionPressurePsi?.message}
              {...register("pumpSuctionPressurePsi")}
            />
            {supplyPressure != null && (
              <button
                type="button"
                onClick={() =>
                  setValue("pumpSuctionPressurePsi", String(supplyPressure.toFixed(2)), {
                    shouldDirty: true,
                  })
                }
                className="self-start rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Use the supply&apos;s pressure at this flow ({formatPressure(supplyPressure)}{" "}
                {UNITS.pressure})
              </button>
            )}
          </div>
        ) : (
          <NumberField
            label="Suction lift"
            unit={UNITS.length}
            hint="How far the water sits below the pump."
            error={errors.pumpSuctionLiftFt?.message}
            {...register("pumpSuctionLiftFt")}
          />
        )}
        <NumberField
          label="Pump safety margin on flow (optional)"
          unit="%"
          hint="Added to the demand flow before the standard rating is chosen. Blank is none."
          error={errors.pumpSafetyMarginPercent?.message}
          {...register("pumpSafetyMarginPercent")}
        />
        <NumberField
          label="Storage duration (optional)"
          unit="min"
          hint={`The ${HAZARD_CLASSIFICATION_LABELS[hazardClassificationFor(hazard)]} range applies; blank takes the top of it.`}
          error={errors.storageDurationMinutes?.message}
          {...register("storageDurationMinutes")}
        />
        <NumberField
          label="Storage safety margin (optional)"
          unit="%"
          hint="Added to the volume. Blank is none."
          error={errors.storageSafetyMarginPercent?.message}
          {...register("storageSafetyMarginPercent")}
        />
      </div>

      {problems.length > 0 && (
        <p className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {problems.join(" ")}
        </p>
      )}

      {failure != null && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
        >
          The pump or storage could not be sized.{" "}
          {failure instanceof Error ? formatApiText(failure.message) : null}
        </div>
      )}

      {noPumpNeeded && (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          The pressure available at the suction already meets the{" "}
          {formatPressure(result.requiredPressureAtSupplyPsi)} {UNITS.pressure} the system needs, so
          a pump has no pressure to add. A pump is only needed where the supply falls short.
        </p>
      )}

      {(demand.result || (noPumpNeeded && capacity.result)) && (
        <div className={`flex flex-col gap-4 ${settling ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ResultCard
              label="Pump rated flow"
              value={demand.result ? formatFlow(demand.result.ratedFlowGpm) : "—"}
              unit={demand.result ? UNITS.flow : undefined}
            />
            <ResultCard
              label="Pump rated pressure"
              value={demand.result ? formatPressure(demand.result.ratedPressurePsi) : "—"}
              unit={demand.result ? UNITS.pressure : undefined}
            />
            <ResultCard
              label="Standard pump rating"
              value={capacity.result ? formatFlow(capacity.result.standardFlowGpm) : "—"}
              unit={capacity.result ? UNITS.flow : undefined}
            />
          </div>

          {storage.result && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ResultCard
                label="Required storage volume"
                value={gallons(storage.result.requiredStorageVolumeGallons)}
                unit="gal"
              />
              <ResultCard
                label="Duration used"
                value={storage.result.durationMinutesUsed}
                unit="min"
                note={
                  storage.result.usedConservativeDefault
                    ? `The top of the ${storage.result.resolvedDurationMinutesMin}–${storage.result.resolvedDurationMinutesMax} min range for this hazard, since none was chosen.`
                    : undefined
                }
              />
            </div>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            The pump rated flow is the demand with the margin; the standard rating is the NFPA 20
            capacity at or above it, and the storage is that rating for the duration. Pump power,
            curve checks and the driver are in the fire pump calculators.
          </p>
        </div>
      )}
    </section>
  );
}
