"use client";

import { useState } from "react";
import { LockedRotorForm } from "./LockedRotorForm";
import { LockedRotorReference } from "./LockedRotorReference";
import { LockedRotorResults } from "./LockedRotorResults";
import type { LockedRotorResponse } from "./types";

/**
 * Owns the page-level state (the calculation result) so app/electrical/locked-rotor/page.tsx
 * can stay a thin server component with no business logic — same pattern as every other
 * calculator feature.
 */
export function LockedRotorCalculator() {
  const [result, setResult] = useState<LockedRotorResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <LockedRotorForm onResult={setResult} />
      {result && <LockedRotorResults result={result} />}
      <LockedRotorReference />
    </div>
  );
}
