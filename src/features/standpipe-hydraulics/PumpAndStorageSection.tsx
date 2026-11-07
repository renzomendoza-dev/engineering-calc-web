"use client";

import Link from "next/link";
import { NumberField } from "@/components/ui/NumberField";
import { ResultCard } from "@/components/ui/ResultCard";
import { SelectField } from "@/components/ui/SelectField";
import {
  buildPumpCapacityRequest,
  buildPumpDemandRequest,
  pumpAddsNoPressure,
  type PumpChainInputs,
} from "@/features/firepump/chain";
import type { FirePumpCapacityResponse, FirePumpDemandResponse } from "@/features/firepump/types";
import { useLiveApiResult } from "@/hooks/useLiveApiResult";
import { formatApiText } from "@/lib/apiText";
import { formatFlow, formatPressure, formatVolume } from "./format";
import type { StandpipeForm } from "./stepProps";
import type { StandpipeHydraulicResponse } from "./types";

const PUMP_DEMAND_PATH = "/api/mechanical/firepump/demand";
const PUMP_CAPACITY_PATH = "/api/mechanical/firepump/capacity";

const SUCTION_OPTIONS = [
  { value: "FLOODED", label: "Flooded — water arrives at the pump under pressure" },
  { value: "LIFT", label: "Suction lift — the water is below the pump" },
];

interface PumpAndStorageSectionProps {
  form: StandpipeForm;
  /** The completed standpipe calculation this is sized from. */
  result: StandpipeHydraulicResponse;
}

/**
 * Sizes a fire pump for the demand just calculated, with the fire pump calculators that already
 * exist, and puts the storage volume beside it.
 *
 * It is a chain, each link the last one's answer: the flow and the pressure required at the supply
 * go to the pump demand calculator (rated flow and pressure, after the suction condition and any
 * margin); the rated flow goes to the capacity calculator (the standard NFPA 20 rating). Every pump
 * figure shown is one of those calculators' answers -- this only chooses what to hand each.
 *
 * The storage volume is not another calculation: it is the standpipe's own, the flow at the supply
 * for the supply duration (NFPA 14 5.2: the demand for at least 30 minutes). The fire water storage
 * calculator works from the NFPA 13 hazard durations, so it is linked to rather than used.
 *
 * What the standpipe calculation can't know -- how the pump takes its water, and the margin -- is
 * collected here and kept with the rest of the form.
 */
export function PumpAndStorageSection({ form, result }: PumpAndStorageSectionProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const inputs: PumpChainInputs = {
    suctionCondition: watch("pumpSuctionCondition") ?? "FLOODED",
    suctionPressurePsi: watch("pumpSuctionPressurePsi"),
    suctionLiftFt: watch("pumpSuctionLiftFt"),
    pumpSafetyMarginPercent: watch("pumpSafetyMarginPercent"),
  };
  const flooded = inputs.suctionCondition === "FLOODED";

  // A supply that already delivers what the system needs leaves nothing for a pump to add, which the
  // pump calculator would refuse; that is the answer, so it is said rather than sent.
  const noPumpNeeded = pumpAddsNoPressure(inputs, result.pressureAtSupplyPsi);

  const demandRequest = buildPumpDemandRequest(inputs, result.flowAtSupplyGpm, result.pressureAtSupplyPsi);
  const demand = useLiveApiResult<FirePumpDemandResponse>(
    PUMP_DEMAND_PATH,
    demandRequest.request && !noPumpNeeded ? JSON.stringify(demandRequest.request) : null,
  );
  const capacity = useLiveApiResult<FirePumpCapacityResponse>(
    PUMP_CAPACITY_PATH,
    demand.result ? JSON.stringify(buildPumpCapacityRequest(demand.result.ratedFlowGpm)) : null,
  );

  const settling = demand.isStale || capacity.isStale;
  const failure = [demand.error, capacity.error].find((error) => error != null);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Fire pump and water storage</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Sized for the flow and pressure the supply has to deliver, {formatFlow(result.flowAtSupplyGpm)} gpm at{" "}
          {formatPressure(result.pressureAtSupplyPsi)} psi, by the fire pump calculators. A pump is needed where the
          supply cannot deliver that pressure.
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
          <NumberField
            label="Pressure available at the pump suction"
            unit="psi"
            hint="What the supply or tank delivers to the pump inlet; 0 if none. It comes off the pressure the pump has to add."
            error={errors.pumpSuctionPressurePsi?.message}
            {...register("pumpSuctionPressurePsi")}
          />
        ) : (
          <NumberField
            label="Suction lift"
            unit="ft"
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
      </div>

      {demandRequest.problems.length > 0 && (
        <p className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {demandRequest.problems.join(" ")}
        </p>
      )}

      {failure != null && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
        >
          The pump could not be sized. {failure instanceof Error ? formatApiText(failure.message) : null}
        </div>
      )}

      {noPumpNeeded && (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          The pressure available at the suction already meets the {formatPressure(result.pressureAtSupplyPsi)} psi the
          system needs, so a pump has no pressure to add. A pump is only needed where the supply falls short.
        </p>
      )}

      {demand.result && (
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${settling ? "opacity-60" : ""}`}>
          <ResultCard label="Pump rated flow" value={formatFlow(demand.result.ratedFlowGpm)} unit="gpm" />
          <ResultCard label="Pump rated pressure" value={formatPressure(demand.result.ratedPressurePsi)} unit="psi" />
          <ResultCard
            label="Standard pump rating"
            value={capacity.result ? formatFlow(capacity.result.standardFlowGpm) : "—"}
            unit={capacity.result ? "gpm" : undefined}
          />
        </div>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        The pump rated flow is the demand with the margin; the standard rating is the NFPA 20 capacity at or above it.
        Pump power, curve checks and the driver are in the{" "}
        <Link href="/mechanical/firepump" className="underline">
          fire pump calculators
        </Link>
        .
      </p>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Water storage</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          The system demand for the supply duration is{" "}
          <span className="font-semibold tabular-nums">{formatVolume(result.waterSupplyVolumeGal)} gal</span> (
          {formatFlow(result.flowAtSupplyGpm)} gpm for {formatVolume(result.supplyDurationMinutes)} minutes). NFPA 14
          5.2 asks for the demand for at least 30 minutes. The{" "}
          <Link href="/mechanical/storage/fire" className="underline">
            fire water storage calculator
          </Link>{" "}
          sizes a tank from the NFPA 13 hazard durations, which suit a sprinkler supply, so it is not applied here.
        </p>
      </div>
    </section>
  );
}
