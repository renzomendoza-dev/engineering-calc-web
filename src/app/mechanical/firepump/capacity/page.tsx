import type { Metadata } from "next";
import { CapacityCalculator } from "@/features/firepump/CapacityCalculator";

export const metadata: Metadata = {
  title: "Fire Pump Capacity Resolution",
};

interface CapacityPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FirePumpCapacityPage({ searchParams }: CapacityPageProps) {
  const params = await searchParams;
  const ratedFlowParam = params.ratedFlow;
  const initialRatedFlow = typeof ratedFlowParam === "string" ? ratedFlowParam : undefined;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Fire Pump Capacity Resolution
      </h1>
      <CapacityCalculator initialRatedFlow={initialRatedFlow} />
    </main>
  );
}
