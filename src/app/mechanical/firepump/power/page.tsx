import type { Metadata } from "next";
import { PowerCalculator } from "@/features/firepump/PowerCalculator";

export const metadata: Metadata = {
  title: "Fire Pump Power / Driver Sizing",
};

export default function FirePumpPowerPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Fire Pump Power / Driver Sizing
      </h1>
      <PowerCalculator />
    </main>
  );
}
