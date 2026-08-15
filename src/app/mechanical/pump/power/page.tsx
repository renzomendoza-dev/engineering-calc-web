import type { Metadata } from "next";
import { PowerCalculator } from "@/features/pump-power/PowerCalculator";

export const metadata: Metadata = {
  title: "Pump Power Calculator",
};

interface PumpPowerPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PumpPowerPage({ searchParams }: PumpPowerPageProps) {
  const params = await searchParams;
  const flowParam = params.flow;
  const flowUnitParam = params.flowUnit;
  const tdhParam = params.tdh;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Pump Power Calculator
      </h1>
      <PowerCalculator
        initialFlowRateValue={typeof flowParam === "string" ? flowParam : undefined}
        initialFlowRateUnit={typeof flowUnitParam === "string" ? flowUnitParam : undefined}
        initialTdh={typeof tdhParam === "string" ? tdhParam : undefined}
      />
    </main>
  );
}
