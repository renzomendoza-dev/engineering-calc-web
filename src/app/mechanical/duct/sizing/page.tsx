import type { Metadata } from "next";
import { DuctSizingCalculator } from "@/features/duct-sizing/DuctSizingCalculator";

export const metadata: Metadata = {
  title: "Duct Sizing Calculator",
};

export default function DuctSizingPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Duct Sizing Calculator
      </h1>
      <DuctSizingCalculator />
    </main>
  );
}
