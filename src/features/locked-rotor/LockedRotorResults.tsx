import type { LockedRotorResponse } from "./types";

interface LockedRotorResultsProps {
  result: LockedRotorResponse;
}

export function LockedRotorResults({ result }: LockedRotorResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>
      <div className="rounded-lg border border-blue-400 bg-blue-50 p-6 text-center dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
          Locked-Rotor Current
        </p>
        <p className="mt-1 text-4xl font-bold text-blue-900 dark:text-blue-100">
          {result.lockedRotorAmps.toFixed(2)} A
        </p>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        This value is for selecting disconnecting means and controllers — it is NOT a
        conductor ampacity figure. Use the Motor FLC calculator&apos;s full-load current for
        conductor and overload sizing.
      </p>
    </div>
  );
}
