import type { Metadata } from "next";
import { LockedRotorCalculator } from "@/features/locked-rotor/LockedRotorCalculator";

export const metadata: Metadata = {
  title: "Locked Rotor Current Calculator",
};

export default function LockedRotorPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Locked Rotor Current Calculator
      </h1>
      <LockedRotorCalculator />
    </main>
  );
}
