import type { Metadata } from "next";
import { PipeVelocityCalculator } from "@/features/pipe-velocity/PipeVelocityCalculator";

export const metadata: Metadata = {
  title: "Pipe Velocity / Sizing Calculator",
};

export default function PipeVelocityPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Pipe Velocity / Sizing Calculator
      </h1>
      <PipeVelocityCalculator />
    </main>
  );
}
