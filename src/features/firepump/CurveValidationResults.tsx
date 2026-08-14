import type { FirePumpCurveValidationResponse } from "./types";

interface ComplianceRowProps {
  label: string;
  pass: boolean;
  detail: string;
}

function ComplianceRow({ label, pass, detail }: ComplianceRowProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${
        pass
          ? "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
      }`}
    >
      <span
        className={`mt-0.5 text-lg leading-none ${
          pass ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        }`}
        aria-hidden="true"
      >
        {pass ? "✓" : "✗"}
      </span>
      <div>
        <p
          className={`text-sm font-medium ${
            pass ? "text-zinc-900 dark:text-zinc-50" : "text-red-700 dark:text-red-400"
          }`}
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{detail}</p>
      </div>
    </div>
  );
}

interface CurveValidationResultsProps {
  result: FirePumpCurveValidationResponse;
  candidateRatedPressurePsi: number;
}

/**
 * The response only carries the computed churn/overload pressures and pass/fail booleans, not
 * the threshold values themselves -- those are re-derived here from the submitted candidate
 * rated pressure (140%/65% of it) purely for display, so a failing check reads as actionable
 * ("142 psi exceeds 140 psi") rather than a bare boolean.
 */
export function CurveValidationResults({ result, candidateRatedPressurePsi }: CurveValidationResultsProps) {
  const churnLimit = candidateRatedPressurePsi * 1.4;
  const overloadLimit = candidateRatedPressurePsi * 0.65;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <div
        className={`rounded-lg border p-4 text-sm font-semibold ${
          result.overallCompliant
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
            : "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
        }`}
      >
        {result.overallCompliant ? "Overall: Compliant" : "Overall: Not compliant"}
      </div>

      <div className="flex flex-col gap-3">
        <ComplianceRow
          label="Capacity"
          pass={result.meetsCapacityDemand}
          detail={
            result.meetsCapacityDemand
              ? "Curve meets the demand flow and pressure."
              : "Curve does not meet the demand flow and pressure."
          }
        />
        <ComplianceRow
          label="Churn"
          pass={result.churnCompliant}
          detail={`Churn: ${result.churnPressurePsi.toFixed(1)} psi — ${
            result.churnCompliant ? "within" : "exceeds"
          } the 140% limit of ${churnLimit.toFixed(1)} psi`}
        />
        <ComplianceRow
          label="Overload"
          pass={result.overloadCompliant}
          detail={`Overload (150% flow): ${result.overloadPressurePsi.toFixed(1)} psi — ${
            result.overloadCompliant ? "meets" : "below"
          } the 65% minimum of ${overloadLimit.toFixed(1)} psi`}
        />
      </div>
    </div>
  );
}
