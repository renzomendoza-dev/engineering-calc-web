import type { Metadata } from "next";
import { DistanceAttenuationCalculator } from "@/features/distance-attenuation/DistanceAttenuationCalculator";

export const metadata: Metadata = {
  title: "Distance Attenuation Calculator",
};

export default function DistanceAttenuationPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Distance Attenuation Calculator
      </h1>
      <DistanceAttenuationCalculator />
    </main>
  );
}
