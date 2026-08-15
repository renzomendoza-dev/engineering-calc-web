import { FormulaBlock } from "@/components/ui/FormulaBlock";
import { PlumeStepCard } from "./PlumeStepCard";
import type { PlumeRegimeType, SmokeProductionRequest, SmokeProductionResponse } from "./types";

const REGIME_LABELS: Record<PlumeRegimeType, string> = {
  NEAR_FIELD: "Near Field",
  FAR_FIELD: "Far Field",
};

const REGIME_BADGE_CLASSES: Record<PlumeRegimeType, string> = {
  NEAR_FIELD: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  FAR_FIELD: "bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};

function fmt(value: number, digits = 2): string {
  return value.toFixed(digits);
}

interface SmokePlumeResultsProps {
  result: SmokeProductionResponse;
  request: SmokeProductionRequest;
}

export function SmokePlumeResults({ result, request }: SmokePlumeResultsProps) {
  // Derived from the response rather than trusting raw form input, since convectiveFraction/
  // fireBaseHeight may have been submitted as null (backend applies its own default in that
  // case) -- back-calculating from the response shows what was actually used, not what was
  // typed (or left blank).
  const effectiveChi = result.convectiveHeatReleaseRate / result.designHeatReleaseRate;
  const effectiveFireBaseHeight = request.ceilingHeight - result.heightAboveFire;
  const smokeTemperatureRise = result.smokeTemperature - request.ambientTemperature;
  const regime = result.plumeRegime.type;

  const regimeTex =
    regime === "NEAR_FIELD"
      ? "\\dot m = 0.032\\,Q_c^{3/5}\\,z"
      : "\\dot m = 0.071\\,Q_c^{1/3}\\,z^{5/3} + 0.0018\\,Q_c";

  const regimeSubstitution =
    regime === "NEAR_FIELD"
      ? `ṁ = 0.032 × ${fmt(result.convectiveHeatReleaseRate)}^0.6 × ${fmt(result.heightAboveFire)} = ${fmt(result.plumeRegime.massFlowRate)} kg/s`
      : `ṁ = 0.071 × ${fmt(result.convectiveHeatReleaseRate)}^(1/3) × ${fmt(result.heightAboveFire)}^(5/3) + 0.0018 × ${fmt(result.convectiveHeatReleaseRate)} = ${fmt(result.plumeRegime.massFlowRate)} kg/s`;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <PlumeStepCard
        step={1}
        title="Design Heat Release Rate"
        formulaLabel="Design Heat Release Rate"
        tex="Q = A \times HRR"
        substitution={`Q = A × HRR = ${fmt(request.designFireArea)} m² × ${fmt(request.heatReleaseRateDensity)} kW/m² = ${fmt(result.designHeatReleaseRate)} kW`}
        resultLabel="Design Heat Release Rate (Q)"
        value={result.designHeatReleaseRate}
        unit="kW"
      />

      <PlumeStepCard
        step={2}
        title="Convective Heat Release Rate"
        formulaLabel="Convective Heat Release Rate"
        tex="Q_c = \chi Q"
        substitution={`Qc = χ × Q = ${fmt(effectiveChi, 3)} × ${fmt(result.designHeatReleaseRate)} = ${fmt(result.convectiveHeatReleaseRate)} kW`}
        resultLabel="Convective Heat Release Rate (Qc)"
        value={result.convectiveHeatReleaseRate}
        unit="kW"
      />

      <PlumeStepCard
        step={3}
        title="Flame Height"
        formulaLabel="Flame Height"
        tex="z_l = 0.166\,Q_c^{2/5}"
        substitution={`z_l = 0.166 × ${fmt(result.convectiveHeatReleaseRate)}^0.4 = ${fmt(result.flameHeight)} m`}
        resultLabel="Flame Height (z_l)"
        value={result.flameHeight}
        unit="m"
      />

      <PlumeStepCard
        step={4}
        title="Height Above Fire"
        formulaLabel="Height Above Fire"
        tex="z = z_{ceiling} - z_{fire\ base}"
        substitution={`z = ${fmt(request.ceilingHeight)} − ${fmt(effectiveFireBaseHeight)} = ${fmt(result.heightAboveFire)} m`}
        resultLabel="Height Above Fire (z)"
        value={result.heightAboveFire}
        unit="m"
      />

      <PlumeStepCard
        step={5}
        title="Plume Regime & Smoke Mass Flow Rate"
        formulaLabel={regime === "NEAR_FIELD" ? "Near Field Mass Flow Rate" : "Far Field Mass Flow Rate"}
        tex={regimeTex}
        substitution={regimeSubstitution}
        resultLabel="Smoke Mass Flow Rate (ṁ)"
        value={result.plumeRegime.massFlowRate}
        unit="kg/s"
        precision={3}
        badge={{ label: REGIME_LABELS[regime], className: REGIME_BADGE_CLASSES[regime] }}
      />

      <PlumeStepCard
        step={6}
        title="Smoke Temperature"
        formulaLabel="Smoke Temperature"
        tex="T_s = T_o + \dfrac{K_s Q_c}{\dot m C_p}"
        substitution={`Ts = To + ΔT = ${fmt(request.ambientTemperature)} + ${fmt(smokeTemperatureRise)} = ${fmt(result.smokeTemperature)} °C`}
        resultLabel="Smoke Temperature (Ts)"
        value={result.smokeTemperature}
        unit="°C"
      />

      <PlumeStepCard
        step={7}
        title="Smoke Density"
        formulaLabel="Smoke Density"
        tex="\rho = \dfrac{P_{atm}}{R\,(T_s + 273)}"
        substitution={`Using Ts = ${fmt(result.smokeTemperature)} °C (${fmt(result.smokeTemperature + 273)} K) → ρ = ${fmt(result.smokeDensity, 3)} kg/m³`}
        resultLabel="Smoke Density (ρ)"
        value={result.smokeDensity}
        unit="kg/m³"
        precision={3}
      />

      <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-5 dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          Step 8: Smoke Volumetric Flow Rate
        </p>
        <div className="mt-3">
          <FormulaBlock label="Volumetric Flow Rate" tex="v = \dfrac{\dot m}{\rho}" highlighted />
        </div>
        <p className="mt-3 font-mono text-sm text-zinc-700 dark:text-zinc-300">
          v = ṁ / ρ = {fmt(result.plumeRegime.massFlowRate, 3)} ÷ {fmt(result.smokeDensity, 3)} = {fmt(result.volumetricFlowRate)} m³/s
        </p>
        <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Smoke Volumetric Flow Rate
        </p>
        <p className="mt-1 text-4xl font-bold text-blue-700 dark:text-blue-300">
          {fmt(result.volumetricFlowRate)}
          <span className="ml-2 text-lg font-normal text-zinc-500">m³/s</span>
        </p>
      </div>
    </div>
  );
}
