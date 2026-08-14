import type { Metadata } from "next";
import { MotorFlcCalculator } from "@/features/motor-flc/MotorFlcCalculator";

export const metadata: Metadata = {
  title: "Motor FLC Calculator",
};

export default function MotorFlcPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Motor FLC Calculator
      </h1>
      <MotorFlcCalculator />
    </main>
  );
}
