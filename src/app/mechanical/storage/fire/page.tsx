import type { Metadata } from "next";
import { FireWaterStorageCalculator } from "@/features/fire-water-storage/FireWaterStorageCalculator";

export const metadata: Metadata = {
  title: "Fire Water Storage Calculator",
};

interface FireWaterStoragePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FireWaterStoragePage({ searchParams }: FireWaterStoragePageProps) {
  const params = await searchParams;
  const ratedPumpFlowParam = params.ratedPumpFlow;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Fire Water Storage Calculator
      </h1>
      <FireWaterStorageCalculator
        initialRatedPumpFlow={typeof ratedPumpFlowParam === "string" ? ratedPumpFlowParam : undefined}
      />
    </main>
  );
}
