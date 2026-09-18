import Link from "next/link";
import { HeadlineResult } from "@/components/ui/HeadlineResult";
import { ResultCard } from "@/components/ui/ResultCard";
import { PressureLossResults } from "@/features/pipe-pressure-loss/PressureLossResults";
import type { PipeSegmentSpec, PumpTDHResponse, SegmentLossDetail } from "./types";

function segmentLabel(segment: PipeSegmentSpec): string {
  const diameterLabel =
    segment.diameterSpecType === "NOMINAL"
      ? `${segment.nominalMaterial ?? ""} ${segment.nominalLabel ?? ""}`.trim()
      : `${segment.rawDiameterValue ?? ""} ${segment.rawDiameterUnit ?? ""}`.trim();
  return `${diameterLabel} — ${segment.lengthMeters.toFixed(1)} m`;
}

interface SegmentDetailsProps {
  label: string;
  details: SegmentLossDetail[];
}

/** Reuses PressureLossResults directly (per segment) rather than building a second display. */
function SegmentDetails({ label, details }: SegmentDetailsProps) {
  if (details.length === 0) return null;

  return (
    <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label} — {details.length} segment{details.length === 1 ? "" : "s"}
      </summary>
      <div className="mt-4 flex flex-col gap-6">
        {details.map((detail, index) => (
          <div key={index} className="flex flex-col gap-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Segment {index + 1}: {segmentLabel(detail.segment)}
            </p>
            <PressureLossResults result={detail.result} />
          </div>
        ))}
      </div>
    </details>
  );
}

interface TDHResultsProps {
  result: PumpTDHResponse;
  flowRateValue: number;
  flowRateUnit: string;
}

export function TDHResults({ result, flowRateValue, flowRateUnit }: TDHResultsProps) {
  const powerHref = `/mechanical/pump/power?tdh=${result.totalDynamicHeadMeters}&flow=${flowRateValue}&flowUnit=${encodeURIComponent(flowRateUnit)}`;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      {result.staticallyFedWarning && (
        <div className="rounded-md border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
          This system is gravity-fed — little or no pump head is required.
        </div>
      )}

      <HeadlineResult label="Total Dynamic Head" value={result.totalDynamicHeadMeters.toFixed(2)} unit="m" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Static Head" value={result.staticHeadMeters.toFixed(2)} unit="m" />
        <ResultCard
          label="Total Suction Head Loss"
          value={result.totalSuctionHeadLossMeters.toFixed(3)}
          unit="m"
        />
        <ResultCard
          label="Total Discharge Head Loss"
          value={result.totalDischargeHeadLossMeters.toFixed(3)}
          unit="m"
        />
        <ResultCard label="Residual Pressure Head" value={result.residualPressureHeadMeters.toFixed(2)} unit="m" />
        {result.velocityHeadMeters !== 0 && (
          <ResultCard label="Velocity Head" value={result.velocityHeadMeters.toFixed(3)} unit="m" />
        )}
      </div>

      <SegmentDetails label="Suction Segment Detail" details={result.suctionSegmentDetails} />
      <SegmentDetails label="Discharge Segment Detail" details={result.dischargeSegmentDetails} />

      <Link
        href={powerHref}
        className="w-fit font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        Use this TDH in power sizing →
      </Link>
    </div>
  );
}
