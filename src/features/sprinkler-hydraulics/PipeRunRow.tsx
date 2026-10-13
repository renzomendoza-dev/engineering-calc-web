"use client";

import { useState, type ReactNode } from "react";
import { get } from "react-hook-form";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";
import { UNITS } from "./labels";
import { materialOptions, scheduleOptions, sizeOptions } from "./pipeOptions";
import { PipeFittingsInput } from "./PipeFittingsInput";
import type { SprinklerForm } from "./stepProps";
import type { FittingEquivalentLengthTableRow } from "./types";

/** A single concrete shape to type run-time paths against; see PipeFittingsInput for why. */
type RunField<K extends string> = `network.riser.${number}.${K}`;

/**
 * The columns every pipe row shares, so a header row above a list lines up with the rows under it:
 * name, size, length, rise, the "more" toggle, and the row's actions. Below the sm breakpoint the
 * row wraps (name and actions on one line, the three figures under them), so this applies from sm.
 */
export const PIPE_ROW_COLUMNS =
  "sm:grid-cols-[minmax(7rem,9.5rem)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,7.5rem)_auto]";

const INPUT_CLASS =
  "w-full rounded-md border bg-white px-2 py-1.5 text-base shadow-sm outline-none transition-colors disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 sm:text-sm dark:bg-zinc-950 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600";
const OK_BORDER =
  "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700";
const ERROR_BORDER = "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500";
const SMALL_LABEL = "text-[11px] text-zinc-500 sm:sr-only dark:text-zinc-400";

/** The column titles for a list of pipe rows. Desktop only: on a phone each field names itself. */
export function PipeRowHeader({ firstColumn }: { firstColumn: string }) {
  return (
    <div
      aria-hidden="true"
      className={`hidden gap-2 px-3 text-[11px] font-medium text-zinc-500 sm:grid dark:text-zinc-400 ${PIPE_ROW_COLUMNS}`}
    >
      <span>{firstColumn}</span>
      <span>Size</span>
      <span>Length ({UNITS.length})</span>
      <span>Rise ({UNITS.length})</span>
      <span />
      <span />
    </div>
  );
}

interface PipeRunRowProps {
  form: SprinklerForm;
  /** Where this pipe lives in the form, e.g. "network.branches.0.crossMain". */
  basePath: string;
  /** Names the pipe in accessible labels, e.g. "branch 1, sprinkler 2". */
  describedAs: string;
  /** What the row is called: "Sprinkler 2", "Cross main to B", "Riser run 1". */
  label: ReactNode;
  materials: PipeMaterialOption[];
  materialsLoading: boolean;
  fittings: FittingEquivalentLengthTableRow[];
  /** Beside the label, for what identifies the row at a glance (a sprinkler's K factor). */
  leading?: ReactNode;
  /** A line under the label, for a figure that belongs to the row (what a sprinkler discharges). */
  readout?: ReactNode;
  /** Fields that belong in the opened panel before the pipe's own (a sprinkler's K factor). */
  detailExtra?: ReactNode;
  /** Duplicate / remove, or nothing for a pipe that is always there (a cross main). */
  actions?: ReactNode;
}

/**
 * One run of pipe on one line: size, length and rise, with the rest -- fittings, material,
 * schedule and C factor, and whatever the caller adds -- in a panel the row opens.
 *
 * Used for every pipe in the network (the one after each sprinkler, each cross main, each riser
 * run), so they are entered the same way. It knows its own path and nothing about where it
 * connects: that is the network's structure (network.ts), not something to type here.
 *
 * The panel opens itself while anything in it is wrong, so an error behind it can't be missed.
 */
export function PipeRunRow({
  form,
  basePath,
  describedAs,
  label,
  materials,
  materialsLoading,
  fittings,
  leading,
  readout,
  detailExtra,
  actions,
}: PipeRunRowProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const [expanded, setExpanded] = useState(false);

  const at = <K extends string>(key: K) => `${basePath}.${key}` as RunField<K>;
  const errorOf = (key: string) =>
    (get(errors, `${basePath}.${key}`) as { message?: string } | undefined)?.message;

  const material = watch(at("pipeMaterial")) as string;
  const schedule = watch(at("schedule")) as string | undefined;
  const fittingCount = ((watch(at("fittings")) as unknown[] | undefined) ?? []).length;

  const detailError =
    get(errors, `${basePath}.fittings`) ||
    errorOf("pipeMaterial") ||
    errorOf("schedule") ||
    errorOf("cFactor");
  const isOpen = expanded || !!detailError;

  const materialRegistration = register(at("pipeMaterial"));
  const scheduleRegistration = register(at("schedule"));

  const materialSelectOptions = materialsLoading
    ? [{ value: material, label: "Loading…" }]
    : materialOptions(materials);
  const scheduleSelectOptions = scheduleOptions(materials, material);
  const sizeSelectOptions = sizeOptions(materials, material, schedule);

  /**
   * Keeps the chosen size when the new material or schedule also has it, and otherwise falls back
   * to the first size it does have, so a pipe never holds a size the API would reject.
   */
  function keepSizeValid(nextMaterial: string, nextSchedule: string | undefined) {
    const sizes = sizeOptions(materials, nextMaterial, nextSchedule);
    const current = watch(at("nominalSize")) as string;
    if (!sizes.some((size) => size.value === current)) {
      setValue(at("nominalSize"), sizes[0]?.value ?? "", { shouldValidate: true });
    }
  }

  const sizeError = errorOf("nominalSize");
  const lengthError = errorOf("pipeLengthFt");
  const riseError = errorOf("elevationChangeFt");
  const messages = [sizeError, lengthError, riseError].filter(Boolean);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <div
        className={`grid grid-cols-3 items-end gap-x-2 gap-y-2 sm:items-center ${PIPE_ROW_COLUMNS}`}
      >
        <div className="order-1 col-span-2 flex min-w-0 flex-col sm:col-span-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {label}
            </span>
            {leading}
          </div>
          {readout}
        </div>

        <label className="order-3 flex flex-col gap-0.5 sm:order-2">
          <span className={SMALL_LABEL}>Size</span>
          <select
            aria-label={`Nominal size, ${describedAs}`}
            aria-invalid={!!sizeError}
            disabled={materialsLoading || sizeSelectOptions.length === 0}
            className={`${INPUT_CLASS} ${sizeError ? ERROR_BORDER : OK_BORDER}`}
            {...register(at("nominalSize"))}
          >
            {sizeSelectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="order-4 flex flex-col gap-0.5 sm:order-3">
          <span className={SMALL_LABEL}>Length ({UNITS.length})</span>
          <input
            type="number"
            step="any"
            aria-label={`Pipe length in ${UNITS.length}, ${describedAs} — centerline, including any vertical run`}
            aria-invalid={!!lengthError}
            className={`${INPUT_CLASS} ${lengthError ? ERROR_BORDER : OK_BORDER}`}
            {...register(at("pipeLengthFt"))}
          />
        </label>

        <label className="order-5 flex flex-col gap-0.5 sm:order-4">
          <span className={SMALL_LABEL}>Rise ({UNITS.length})</span>
          <input
            type="number"
            step="any"
            aria-label={`Rise in ${UNITS.length}, ${describedAs} — up is positive, down negative`}
            aria-invalid={!!riseError}
            className={`${INPUT_CLASS} ${riseError ? ERROR_BORDER : OK_BORDER}`}
            {...register(at("elevationChangeFt"))}
          />
        </label>

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? "Hide" : "Show"} fittings and pipe details, ${describedAs}`}
          className={`order-6 col-span-3 rounded-md border px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-zinc-100 sm:order-5 sm:col-span-1 dark:hover:bg-zinc-800 ${
            detailError
              ? "border-red-400 text-red-700 dark:text-red-400"
              : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          {isOpen ? "▾" : "▸"} More
          {fittingCount > 0 ? ` · ${fittingCount} fitting${fittingCount === 1 ? "" : "s"}` : ""}
        </button>

        {actions && <div className="order-2 justify-self-end sm:order-6">{actions}</div>}
      </div>

      {messages.length > 0 && (
        <p className="text-xs text-red-600 dark:text-red-400">{messages.join(" · ")}</p>
      )}

      {isOpen && (
        <div className="flex flex-col gap-3 rounded-md bg-zinc-50 p-3 dark:bg-zinc-900/60">
          {detailExtra}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-0.5">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Pipe material</span>
              <select
                disabled={materialsLoading}
                aria-invalid={!!errorOf("pipeMaterial")}
                className={`${INPUT_CLASS} ${errorOf("pipeMaterial") ? ERROR_BORDER : OK_BORDER}`}
                {...materialRegistration}
                onChange={(event) => {
                  materialRegistration.onChange(event);
                  // Schedules belong to a material, so the old one may not exist under the new one.
                  const nextSchedule =
                    scheduleOptions(materials, event.target.value)[0]?.value ?? "";
                  setValue(at("schedule"), nextSchedule, { shouldValidate: true });
                  keepSizeValid(event.target.value, nextSchedule);
                }}
              >
                {materialSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errorOf("pipeMaterial") && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {errorOf("pipeMaterial")}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-0.5">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Schedule</span>
              <select
                disabled={materialsLoading || scheduleSelectOptions.length === 0}
                aria-invalid={!!errorOf("schedule")}
                className={`${INPUT_CLASS} ${errorOf("schedule") ? ERROR_BORDER : OK_BORDER}`}
                {...scheduleRegistration}
                onChange={(event) => {
                  scheduleRegistration.onChange(event);
                  keepSizeValid(material, event.target.value);
                }}
              >
                {scheduleSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errorOf("schedule") && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {errorOf("schedule")}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-0.5">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">C factor</span>
              <input
                type="number"
                step="any"
                aria-invalid={!!errorOf("cFactor")}
                className={`${INPUT_CLASS} ${errorOf("cFactor") ? ERROR_BORDER : OK_BORDER}`}
                {...register(at("cFactor"))}
              />
              {errorOf("cFactor") && (
                <span className="text-xs text-red-600 dark:text-red-400">{errorOf("cFactor")}</span>
              )}
            </label>
          </div>

          <PipeFittingsInput
            form={form}
            basePath={basePath}
            fittings={fittings}
            describedAs={describedAs}
          />
        </div>
      )}
    </div>
  );
}
