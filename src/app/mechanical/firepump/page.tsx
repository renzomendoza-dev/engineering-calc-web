import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fire Pump Sizing Suite",
};

const SECTIONS = [
  {
    name: "Demand",
    description: "Derive rated flow and pressure from system demand and suction conditions.",
    href: "/mechanical/firepump/demand",
  },
  {
    name: "Capacity Resolution",
    description: "Resolve a rated flow to the nearest standard pump capacity.",
    href: "/mechanical/firepump/capacity",
  },
  {
    name: "Curve Validation",
    description: "Check a candidate pump curve against the churn/overload/capacity rules.",
    href: "/mechanical/firepump/curve-validation",
  },
  {
    name: "Power / Driver Sizing",
    description: "Compute brake horsepower and recommended electric motor size.",
    href: "/mechanical/firepump/power",
  },
];

export default function FirePumpHubPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Fire Pump Sizing Suite</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Four independent calculators. A Demand result can be carried forward into Capacity
          Resolution and Curve Validation.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{section.name}</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{section.description}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
