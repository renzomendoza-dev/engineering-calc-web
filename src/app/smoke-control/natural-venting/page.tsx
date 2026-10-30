import type { Metadata } from "next";
import { NaturalVentingCalculator } from "@/features/natural-venting/NaturalVentingCalculator";

export const metadata: Metadata = {
  title: "Natural Smoke and Heat Venting (NFPA 204)",
};

export default function NaturalVentingPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Natural Smoke and Heat Venting (NFPA 204)
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Vent and inlet areas for curtained areas by the hand calculations of NFPA 204 (2021),
        Section 9.2, with the dimension and spacing rules of Chapters 5 to 7. Add as many curtained
        areas and design fires as the project needs.
      </p>
      <NaturalVentingCalculator />
    </main>
  );
}
