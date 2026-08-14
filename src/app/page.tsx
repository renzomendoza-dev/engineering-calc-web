import Link from "next/link";
import { calculators } from "@/lib/calculators";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Calculators
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Select a calculator to get started.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {calculators.map((calculator) => {
          const isAvailable = calculator.status === "available";
          const card = (
            <div
              className={`flex h-full flex-col gap-2 rounded-lg border p-4 ${
                isAvailable
                  ? "border-zinc-200 bg-zinc-50 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  : "border-zinc-200 bg-zinc-50 opacity-50 dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {calculator.name}
                </span>
                <span className="shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {calculator.category}
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {calculator.description}
              </p>
              {!isAvailable && (
                <span className="mt-auto text-xs font-medium text-zinc-500 dark:text-zinc-500">
                  Coming soon
                </span>
              )}
            </div>
          );

          return isAvailable ? (
            <Link key={calculator.href} href={calculator.href}>
              {card}
            </Link>
          ) : (
            <div key={calculator.href}>{card}</div>
          );
        })}
      </div>
    </main>
  );
}
