import type { Metadata } from "next";
import { VentAreaCalculator } from "@/features/smoke-vent-area/VentAreaCalculator";

export const metadata: Metadata = {
  title: "Natural Smoke Vent Area Calculator",
};

interface VentAreaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VentAreaPage({ searchParams }: VentAreaPageProps) {
  const params = await searchParams;
  const volumetricFlowRateParam = params.volumetricFlowRate;
  const smokeTemperatureParam = params.smokeTemperature;
  const ambientTemperatureParam = params.ambientTemperature;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Natural Smoke Vent Area Calculator
      </h1>
      <VentAreaCalculator
        initialVolumetricFlowRate={typeof volumetricFlowRateParam === "string" ? volumetricFlowRateParam : undefined}
        initialSmokeTemperature={typeof smokeTemperatureParam === "string" ? smokeTemperatureParam : undefined}
        initialAmbientTemperature={typeof ambientTemperatureParam === "string" ? ambientTemperatureParam : undefined}
      />
    </main>
  );
}
