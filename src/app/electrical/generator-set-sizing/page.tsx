import type { Metadata } from "next";
import { GeneratorSetSizingCalculator } from "@/features/generator-set-sizing/GeneratorSetSizingCalculator";

export const metadata: Metadata = {
  title: "Generator Set Sizing",
};

export default function GeneratorSetSizingPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Generator Set Sizing
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Standby generator load and output circuit, following PEC 2017 Article 2.20 (load), Article
        4.30 (motors), Article 4.45 (generators) and Chapter 7 (standby systems).
      </p>
      <GeneratorSetSizingCalculator />
    </main>
  );
}
