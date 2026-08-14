import type { Metadata } from "next";
import { VoltageDropCalculator } from "@/features/voltage-drop/VoltageDropCalculator";

export const metadata: Metadata = {
  title: "Voltage Drop Calculator",
};

export default function VoltageDropPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Voltage Drop Calculator
      </h1>
      <VoltageDropCalculator />
    </main>
  );
}
