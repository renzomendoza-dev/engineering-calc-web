import type { Metadata } from "next";
import Link from "next/link";
import { PressureTankCalculator } from "@/features/pressure-tank/PressureTankCalculator";

export const metadata: Metadata = {
  title: "Pressure Tank Sizing Calculator",
};

export default function PressureTankPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Pressure Tank Sizing Calculator
      </h1>
      <p className="-mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        Looking for thermal expansion tank sizing instead?{" "}
        <Link href="/mechanical/tank/expansion" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Expansion Tank Sizing →
        </Link>
      </p>
      <PressureTankCalculator />
    </main>
  );
}
