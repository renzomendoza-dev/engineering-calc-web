import { ResultCard } from "@/components/ui/ResultCard";
import type {
  AudibilityOutcome,
  FireAlarmAudibilityRequest,
  FireAlarmAudibilityResponse,
  GoverningAudibilityRule,
} from "./types";

const OUTCOME_LABELS: Record<AudibilityOutcome, string> = {
  PASS: "Pass",
  FAIL: "Fail",
  EXCEEDS_MAX_LIMIT: "Exceeds Max Limit",
};

const OUTCOME_BANNER_CLASSES: Record<AudibilityOutcome, string> = {
  PASS: "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
  FAIL: "border-red-400 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-950/40 dark:text-red-300",
  EXCEEDS_MAX_LIMIT:
    "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
};

const MODE_LABELS = {
  PUBLIC: "Public",
  PRIVATE: "Private",
  SLEEPING: "Sleeping Area",
} as const;

function governingRuleText(rule: GoverningAudibilityRule, mode: FireAlarmAudibilityRequest["mode"]): string {
  switch (rule) {
    case "AVERAGE_AMBIENT_PLUS_OFFSET":
      return `Governed by: average ambient +${mode === "PRIVATE" ? "10" : "15"} dB rule`;
    case "MAX_SUSTAINED_PLUS_OFFSET":
      return "Governed by: 60-second max ambient +5 dB rule";
    case "ABSOLUTE_SLEEPING_FLOOR":
      return "Governed by: 75 dBA absolute sleeping-area floor";
  }
}

interface FireAlarmAudibilityResultsProps {
  result: FireAlarmAudibilityResponse;
  request: FireAlarmAudibilityRequest;
}

export function FireAlarmAudibilityResults({ result, request }: FireAlarmAudibilityResultsProps) {
  const marginDb = result.calculatedTargetSplDb - result.requiredThresholdDb;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <div className={`rounded-lg border px-4 py-3 ${OUTCOME_BANNER_CLASSES[result.outcome]}`}>
        <p className="text-lg font-semibold">{OUTCOME_LABELS[result.outcome]}</p>
        <p className="mt-1 text-sm">{governingRuleText(result.governingRule, request.mode)}</p>
        {result.outcome === "EXCEEDS_MAX_LIMIT" && (
          <p className="mt-2 text-sm">
            Exceeds NFPA 72&apos;s 110 dBA system-wide limit — reduce appliance output or
            address ambient noise at the source. This is a design conflict, not simply an
            insufficient signal.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Calculated Target SPL" value={result.calculatedTargetSplDb.toFixed(2)} unit="dB" />
        <ResultCard label="Required Threshold" value={result.requiredThresholdDb.toFixed(2)} unit="dB" />
      </div>

      <ResultCard
        label={marginDb >= 0 ? "Margin" : "Shortfall"}
        value={`${marginDb >= 0 ? "+" : ""}${marginDb.toFixed(2)}`}
        unit="dB"
        tone={marginDb >= 0 ? "default" : "warning"}
      />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Inputs</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ResultCard label="Mode" value={MODE_LABELS[request.mode]} />
          <ResultCard
            label="Appliance SPL"
            value={request.applianceSplAtReferenceDb.toFixed(1)}
            unit="dB"
          />
          <ResultCard
            label="Reference / Target Distance"
            value={`${request.referenceDistanceMeters.toFixed(2)} / ${request.targetDistanceMeters.toFixed(2)}`}
            unit="m"
          />
          <ResultCard
            label="Measured Average Ambient"
            value={request.measuredAverageAmbientDb.toFixed(1)}
            unit="dB"
          />
          <ResultCard
            label="Measured Max Sustained Ambient"
            value={
              request.measuredMaxSustainedAmbientDb === null
                ? "Not measured"
                : request.measuredMaxSustainedAmbientDb.toFixed(1)
            }
            unit={request.measuredMaxSustainedAmbientDb === null ? undefined : "dB"}
          />
        </div>
      </div>
    </div>
  );
}
