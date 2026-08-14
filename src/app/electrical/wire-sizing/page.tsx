import type { Metadata } from "next";
import { WireSizingCalculator } from "@/features/wire-sizing/WireSizingCalculator";

export const metadata: Metadata = {
  title: "Wire Sizing Calculator",
};

export default function WireSizingPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Wire Sizing Calculator
      </h1>
      <WireSizingCalculator />
    </main>
  );
}
