import type { Metadata } from "next";
import { ConduitFillCalculator } from "@/features/conduit-fill/ConduitFillCalculator";

export const metadata: Metadata = {
  title: "Conduit Fill Calculator",
};

export default function ConduitFillPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Conduit Fill Calculator
      </h1>
      <ConduitFillCalculator />
    </main>
  );
}
