import type { Metadata } from "next";
import { SmokePlumeCalculator } from "@/features/smoke-plume/SmokePlumeCalculator";

export const metadata: Metadata = {
  title: "Smoke Production (Plume) Calculator",
};

export default function SmokePlumePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Smoke Production (Plume) Calculator
      </h1>
      <SmokePlumeCalculator />
    </main>
  );
}
