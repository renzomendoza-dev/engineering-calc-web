import type { Metadata } from "next";
import { DomesticWaterStorageCalculator } from "@/features/domestic-water-storage/DomesticWaterStorageCalculator";

export const metadata: Metadata = {
  title: "Domestic Water Storage Calculator",
};

export default function DomesticWaterStoragePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Domestic Water Storage Calculator
      </h1>
      <DomesticWaterStorageCalculator />
    </main>
  );
}
