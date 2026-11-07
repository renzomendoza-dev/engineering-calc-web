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
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Chapters 4 to 10 of the standard are for nonsprinklered single-story buildings (1.1.1).
        Venting in a sprinklered building needs an engineering analysis the authority having
        jurisdiction accepts (11.1). The method is not valid for a fire above 12,000 z<sub>s</sub>
        <sup>5/2</sup> kW (1.3.5) or while the smoke layer is above 600 °C (1.3.4); the results flag
        both.
      </p>
      <NaturalVentingCalculator />
    </main>
  );
}
