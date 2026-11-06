import type { Metadata } from "next";
import { StandpipeCalculator } from "@/features/standpipe-hydraulics/StandpipeCalculator";

export const metadata: Metadata = {
  title: "Standpipe Hydraulic Calculation (NFPA 14)",
};

export default function StandpipeHydraulicsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Standpipe Hydraulic Calculation (NFPA 14)
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        The flow a standpipe system must deliver for its class, and the pressure needed at the supply
        to deliver it at the hydraulically most remote hose connection, worked back along the pipe
        with Hazen-Williams friction, fitting equivalent lengths and elevation.
      </p>
      <StandpipeCalculator />
    </main>
  );
}
