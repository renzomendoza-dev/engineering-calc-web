import type { Metadata } from "next";
import { SprinklerHydraulicsCalculator } from "@/features/sprinkler-hydraulics/SprinklerHydraulicsCalculator";

export const metadata: Metadata = {
  title: "Fire Sprinkler Hydraulic Calculation",
};

export default function SprinklerHydraulicsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Fire Sprinkler Hydraulic Calculation
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Works the remote area back to the supply point in NFPA 13 units (psi, gpm, ft) and
          compares the demand against the water supply curve.
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Reference data from NFPA 13, 2019 edition. Not a substitute for the standard, or for a
          licensed designer&apos;s review.
        </p>
      </div>
      <SprinklerHydraulicsCalculator />
    </main>
  );
}
