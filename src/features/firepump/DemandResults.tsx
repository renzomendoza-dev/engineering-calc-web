import Link from "next/link";
import { ResultCard } from "@/components/ui/ResultCard";
import type { FirePumpDemandResponse } from "./types";

interface DemandResultsProps {
  result: FirePumpDemandResponse;
}

export function DemandResults({ result }: DemandResultsProps) {
  const capacityHref = `/mechanical/firepump/capacity?ratedFlow=${result.ratedFlowGpm}`;
  const curveHref = `/mechanical/firepump/curve-validation?demandFlow=${result.ratedFlowGpm}&demandPressure=${result.ratedPressurePsi}`;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Rated Flow" value={result.ratedFlowGpm.toFixed(1)} unit="GPM" />
        <ResultCard label="Rated Pressure" value={result.ratedPressurePsi.toFixed(2)} unit="psi" />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link href={capacityHref} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Use this in Capacity Resolution →
        </Link>
        <Link href={curveHref} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Use this in Curve Validation →
        </Link>
      </div>
    </div>
  );
}
