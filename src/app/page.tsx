import Link from "next/link";
import { calculators, type CalculatorConfig } from "@/lib/calculators";

/**
 * Preserves each category's first-appearance order from calculators.ts rather than sorting
 * alphabetically, so the array's own ordering stays the single source of truth for section
 * order (matches its existing role as source of truth for card order within a section).
 */
function groupByCategory(items: CalculatorConfig[]): [string, CalculatorConfig[]][] {
  const groups = new Map<string, CalculatorConfig[]>();
  for (const item of items) {
    const group = groups.get(item.category);
    if (group) {
      group.push(item);
    } else {
      groups.set(item.category, [item]);
    }
  }
  return Array.from(groups.entries());
}

export default function Home() {
  const groups = groupByCategory(calculators);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Calculators
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Select a calculator to get started.
        </p>
      </div>
      {groups.map(([category, items]) => (
        <div key={category} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{category}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((calculator) => {
              const isAvailable = calculator.status === "available";
              const card = (
                <div
                  className={`flex h-full flex-col gap-2 rounded-lg border p-4 ${
                    isAvailable
                      ? "border-zinc-200 bg-zinc-50 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                      : "border-zinc-200 bg-zinc-50 opacity-50 dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {calculator.name}
                  </span>
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
        </div>
      ))}
    </main>
  );
}
