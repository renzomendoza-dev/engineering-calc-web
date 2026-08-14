"use client";

import { useState } from "react";
import { ConduitFillForm } from "./ConduitFillForm";
import { ConduitFillReference } from "./ConduitFillReference";
import { ConduitFillResults } from "./ConduitFillResults";
import type { ConduitFillResponse } from "./types";

/**
 * Owns the page-level state (the calculation result) so app/electrical/conduit-fill/page.tsx
 * can stay a thin server component with no business logic — same pattern as
 * VoltageDropCalculator.
 */
export function ConduitFillCalculator() {
  const [result, setResult] = useState<ConduitFillResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <ConduitFillForm onResult={setResult} />
      {result && <ConduitFillResults result={result} />}
      <ConduitFillReference />
    </div>
  );
}
