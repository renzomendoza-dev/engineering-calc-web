import { FormulaBlock } from "@/components/ui/FormulaBlock";
import { PlumeStepCard } from "@/features/smoke-plume/PlumeStepCard";
import type { VentAreaRequest, VentAreaResponse } from "./types";

/** Confirmed from reference/common/air-properties.json -- standard gravity, ISO 80000-3. */
const GRAVITATIONAL_ACCELERATION = 9.81;
/** Confirmed from reference/smoke-control/defaults.json -- typical Cd for natural smoke vents. */
const DEFAULT_DISCHARGE_COEFFICIENT = 0.6;

function fmt(value: number, digits = 2): string {
  return value.toFixed(digits);
}

interface VentAreaResultsProps {
  result: VentAreaResponse;
  request: VentAreaRequest;
}

export function VentAreaResults({ result, request }: VentAreaResultsProps) {
  const ambientTemperatureKelvin = request.ambientTemperature + 273;
  // The response doesn't echo which Cd was actually used -- unlike chi/Ks in the sibling
  // plume calculators, Cd can't be back-calculated from the response either (it's entangled
  // with g, which isn't exposed via the API), so this falls back to the confirmed reference
  // default only when the user left the field blank, same as what the backend itself does.
  const effectiveDischargeCoefficient = request.dischargeCoefficient ?? DEFAULT_DISCHARGE_COEFFICIENT;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <PlumeStepCard
        step={1}
        title="Temperature Difference"
        formulaLabel="Temperature Difference"
        tex="\Delta T = T_s - T_o"
        substitution={`ΔT = Ts − To = ${fmt(request.smokeTemperature)} − ${fmt(request.ambientTemperature)} = ${fmt(result.temperatureDifference)} °C`}
        resultLabel="Temperature Difference (ΔT)"
        value={result.temperatureDifference}
        unit="°C"
      />

      <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-5 dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          Step 2: Required Vent Area
        </p>
        <div className="mt-3">
          <FormulaBlock
            label="Required Vent Area"
            tex="A_v = \dfrac{V}{C_d\sqrt{2gH\left(\dfrac{\Delta T}{T_o + 273}\right)}}"
            highlighted
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          To is converted to Kelvin specifically for this step: To_K = To + 273 = {fmt(ambientTemperatureKelvin)} K.
        </p>
        <p className="mt-3 font-mono text-sm text-zinc-700 dark:text-zinc-300">
          Av = V / (Cd × √(2gH × (ΔT / To_K))) = {fmt(request.volumetricFlowRate)} / ({fmt(effectiveDischargeCoefficient)} × √(2 × {GRAVITATIONAL_ACCELERATION} × {fmt(request.ventHeight)} × ({fmt(result.temperatureDifference)} / {fmt(ambientTemperatureKelvin)}))) = {fmt(result.requiredVentArea)} m²
        </p>
        <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">Required Vent Area</p>
        <p className="mt-1 text-4xl font-bold text-blue-700 dark:text-blue-300">
          {fmt(result.requiredVentArea)}
          <span className="ml-2 text-lg font-normal text-zinc-500">m²</span>
        </p>
      </div>
    </div>
  );
}
