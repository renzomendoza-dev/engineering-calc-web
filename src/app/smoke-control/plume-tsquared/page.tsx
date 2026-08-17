import type { Metadata } from "next";
import { TSquaredSmokePlumeCalculator } from "@/features/smoke-plume-tsquared/TSquaredSmokePlumeCalculator";

export const metadata: Metadata = {
  title: "t-Squared Fire Growth Smoke Production Calculator",
};

export default function TSquaredSmokePlumePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        t-Squared Fire Growth Smoke Production Calculator
      </h1>
      <TSquaredSmokePlumeCalculator />
    </main>
  );
}
