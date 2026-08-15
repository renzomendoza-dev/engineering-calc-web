import type { Metadata } from "next";
import { FireAlarmAudibilityCalculator } from "@/features/fire-alarm-audibility/FireAlarmAudibilityCalculator";

export const metadata: Metadata = {
  title: "Fire Alarm Audibility Calculator",
};

export default function FireAlarmAudibilityPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Fire Alarm Audibility Calculator
      </h1>
      <FireAlarmAudibilityCalculator />
    </main>
  );
}
