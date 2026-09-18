import { HeadlineResult } from "@/components/ui/HeadlineResult";
import type { LockedRotorResponse } from "./types";

interface LockedRotorResultsProps {
  result: LockedRotorResponse;
}

export function LockedRotorResults({ result }: LockedRotorResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>
      <HeadlineResult label="Locked-Rotor Current" value={result.lockedRotorAmps.toFixed(2)} unit="A" />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        This value is for selecting disconnecting means and controllers — it is NOT a
        conductor ampacity figure. Use the Motor FLC calculator&apos;s full-load current for
        conductor and overload sizing.
      </p>
    </div>
  );
}
