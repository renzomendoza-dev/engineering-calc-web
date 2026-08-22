"use client";

import { useCallback, useState } from "react";
import { DuctSizingForm } from "./DuctSizingForm";
import { DuctSizingResults } from "./DuctSizingResults";
import { DuctSizingFormula } from "./DuctSizingFormula";
import type { DuctShape, DuctSizingMethod, DuctSizingResponse } from "./types";

/**
 * Owns the page-level state (result, plus shape/method mirrored up from the form) so
 * app/mechanical/duct/sizing/page.tsx can stay a thin server component. Shape/method live
 * inside DuctSizingForm's own react-hook-form state (they're toggles within one form, not
 * separate form components like PipeVelocityCalculator's mode tabs) but are also mirrored here
 * via callback props purely so the always-visible Formula Reference section can react to them.
 */
export function DuctSizingCalculator() {
  const [result, setResult] = useState<DuctSizingResponse | null>(null);
  const [shape, setShape] = useState<DuctShape>("ROUND");
  const [method, setMethod] = useState<DuctSizingMethod>("EQUAL_FRICTION");

  const handleResult = useCallback((next: DuctSizingResponse) => {
    setResult(next);
  }, []);

  const handleShapeChange = useCallback(
    (next: DuctShape) => {
      if (next !== shape) setResult(null);
      setShape(next);
    },
    [shape],
  );

  const handleMethodChange = useCallback(
    (next: DuctSizingMethod) => {
      if (next !== method) setResult(null);
      setMethod(next);
    },
    [method],
  );

  return (
    <div className="flex flex-col gap-8">
      <DuctSizingForm
        onResult={handleResult}
        onShapeChange={handleShapeChange}
        onMethodChange={handleMethodChange}
      />
      {result && <DuctSizingResults result={result} />}
      <DuctSizingFormula shape={shape} method={method} />
    </div>
  );
}
