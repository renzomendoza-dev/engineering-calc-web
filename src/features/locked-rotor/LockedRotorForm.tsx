"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost, ApiError } from "@/lib/api-client";
import { lockedRotorSchema, type LockedRotorFormInput, type LockedRotorFormValues } from "./schema";
import type { LockedRotorRequest, LockedRotorResponse } from "./types";

const phaseOptions: SelectOption[] = [
  { value: "false", label: "Single-Phase" },
  { value: "true", label: "Polyphase" },
];

const defaultValues: LockedRotorFormInput = {
  isPolyphase: false,
  horsepowerLabel: "",
  voltage: 0,
};

interface LockedRotorFormProps {
  onResult: (result: LockedRotorResponse) => void;
}

export function LockedRotorForm({ onResult }: LockedRotorFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LockedRotorFormInput, unknown, LockedRotorFormValues>({
    resolver: zodResolver(lockedRotorSchema),
    defaultValues,
  });

  const onSubmit = async (values: LockedRotorFormValues) => {
    setGeneralError(null);

    const request: LockedRotorRequest = {
      isPolyphase: values.isPolyphase,
      horsepowerLabel: values.horsepowerLabel,
      voltage: values.voltage,
    };

    try {
      const result = await apiPost<LockedRotorRequest, LockedRotorResponse>(
        "/api/electrical/locked-rotor",
        request,
      );
      onResult(result);
    } catch (err) {
      if (err instanceof ApiError) {
        const unmatched: string[] = [];
        if (err.fieldErrors) {
          for (const [field, message] of Object.entries(err.fieldErrors)) {
            if (field in defaultValues) {
              setError(field as keyof LockedRotorFormInput, { message });
            } else {
              unmatched.push(message);
            }
          }
        }
        setGeneralError(unmatched.length > 0 ? unmatched.join(" ") : err.message);
      } else {
        setGeneralError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <SelectField
        label="Motor Type"
        options={phaseOptions}
        error={errors.isPolyphase?.message}
        {...register("isPolyphase", { setValueAs: (value) => value === "true" || value === true })}
      />

      {/* Plain text input, not NumberField: horsepower labels include fractions like "1/4"
          and "1 1/2" that a native number input can't represent. This is a one-off field
          for a deliberately simple standalone tool, so it's inlined rather than promoted to
          a new reusable components/ui field. */}
      <div className="flex flex-col gap-1">
        <label htmlFor="horsepowerLabel" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Horsepower
        </label>
        <input
          id="horsepowerLabel"
          type="text"
          placeholder="e.g. 1/4, 1 1/2, 10"
          aria-invalid={!!errors.horsepowerLabel}
          className={`rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition-colors bg-white dark:bg-zinc-950 ${
            errors.horsepowerLabel
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700"
          }`}
          {...register("horsepowerLabel")}
        />
        {errors.horsepowerLabel && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.horsepowerLabel.message}</p>
        )}
      </div>

      <NumberField label="Voltage" unit="V" error={errors.voltage?.message} {...register("voltage")} />

      {generalError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {generalError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Calculating…" : "Calculate"}
      </button>
    </form>
  );
}
