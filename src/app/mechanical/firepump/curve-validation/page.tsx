import type { Metadata } from "next";
import { CurveValidationCalculator } from "@/features/firepump/CurveValidationCalculator";

export const metadata: Metadata = {
  title: "Fire Pump Curve Validation",
};

interface CurveValidationPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FirePumpCurveValidationPage({ searchParams }: CurveValidationPageProps) {
  const params = await searchParams;
  const demandFlowParam = params.demandFlow;
  const demandPressureParam = params.demandPressure;
  const initialDemandFlow = typeof demandFlowParam === "string" ? demandFlowParam : undefined;
  const initialDemandPressure = typeof demandPressureParam === "string" ? demandPressureParam : undefined;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Fire Pump Curve Validation
      </h1>
      <CurveValidationCalculator
        initialDemandFlow={initialDemandFlow}
        initialDemandPressure={initialDemandPressure}
      />
    </main>
  );
}
