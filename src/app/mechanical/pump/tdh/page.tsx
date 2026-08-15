import type { Metadata } from "next";
import { TDHCalculator } from "@/features/pump-tdh/TDHCalculator";

export const metadata: Metadata = {
  title: "Pump Total Dynamic Head Calculator",
};

export default function PumpTdhPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Pump Total Dynamic Head Calculator
      </h1>
      <TDHCalculator />
    </main>
  );
}
