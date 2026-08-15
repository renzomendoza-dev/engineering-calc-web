import type { Metadata } from "next";
import { PressureLossCalculator } from "@/features/pipe-pressure-loss/PressureLossCalculator";

export const metadata: Metadata = {
  title: "Pipe Pressure Loss Calculator",
};

export default function PipePressureLossPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Pipe Pressure Loss Calculator
      </h1>
      <PressureLossCalculator />
    </main>
  );
}
