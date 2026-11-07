"use client";

import { SelectField, type SelectOption } from "@/components/ui/SelectField";

interface QuickFillSelectProps {
  id: string;
  label: string;
  hint?: string;
  placeholder: string;
  options: SelectOption[];
  /** The table is still loading. */
  loading?: boolean;
  /** The table could not be loaded: the field beside it still takes a typed value. */
  failed?: boolean;
  onPick: (key: string) => void;
}

/**
 * A select that fills a number field from a reference table and then returns to its prompt. It
 * holds no value of its own: the field it fills stays the one the form reads, can still be typed
 * over, and is what the request carries.
 */
export function QuickFillSelect({
  id,
  label,
  hint,
  placeholder,
  options,
  loading,
  failed,
  onPick,
}: QuickFillSelectProps) {
  const prompt = loading ? "Loading…" : failed ? "Table not available" : placeholder;
  return (
    <SelectField
      id={id}
      label={label}
      hint={hint}
      value=""
      disabled={loading || failed}
      options={[{ value: "", label: prompt }, ...options]}
      onChange={(event) => {
        if (event.target.value !== "") onPick(event.target.value);
      }}
    />
  );
}
