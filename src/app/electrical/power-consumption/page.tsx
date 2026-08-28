import type { Metadata } from "next";
import { PowerConsumptionCalculator } from "@/features/power-consumption/PowerConsumptionCalculator";

export const metadata: Metadata = {
  title: "Power Consumption / Energy Cost Estimator",
};

export default function PowerConsumptionPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Power Consumption / Energy Cost Estimator
      </h1>
      <PowerConsumptionCalculator />
    </main>
  );
}
