import type { Metadata } from "next";
import { DemandCalculator } from "@/features/firepump/DemandCalculator";

export const metadata: Metadata = {
  title: "Fire Pump Demand Calculator",
};

export default function FirePumpDemandPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Fire Pump Demand Calculator
      </h1>
      <DemandCalculator />
    </main>
  );
}
