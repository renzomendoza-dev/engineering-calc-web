import type { Metadata } from "next";
import Link from "next/link";
import { ExpansionTankCalculator } from "@/features/expansion-tank/ExpansionTankCalculator";

export const metadata: Metadata = {
  title: "Expansion Tank Sizing Calculator",
};

export default function ExpansionTankPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Expansion Tank Sizing Calculator
      </h1>
      <p className="-mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        Looking for hydropneumatic pressure tank sizing instead?{" "}
        <Link href="/mechanical/tank/pressure" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Pressure Tank Sizing →
        </Link>
      </p>
      <ExpansionTankCalculator />
    </main>
  );
}
