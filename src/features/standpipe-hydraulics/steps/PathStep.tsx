"use client";

import { useFieldArray } from "react-hook-form";
import { newSegment } from "../defaults";
import type { StepProps } from "../stepProps";
import { FdcSection } from "./path/FdcSection";
import { PathReferenceTables } from "./path/PathReferenceTables";
import { SegmentCard } from "./path/SegmentCard";

/**
 * Step 2: the pipe path from the hydraulically most remote hose connection back to the supply, one
 * row per run of pipe, remote end first, like the rows of a hydraulic calculation sheet.
 */
export function PathStep({
  form,
  materials,
  materialsLoading,
  fittings,
  cFactors,
  referenceEdition,
  hoseNozzles,
  hoseNozzleNote,
  referenceLoading,
  referenceFailed,
}: StepProps) {
  const {
    control,
    getValues,
    formState: { errors },
  } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: "segments", keyName: "rowId" });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Start at the hose connection that is hardest to reach and work back to the supply. A hose
        connection&apos;s outlet is held at the residual pressure the standard requires; pressure
        then builds up along the path.
      </p>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {fields.length} {fields.length === 1 ? "segment" : "segments"}
        </span>
        <button
          type="button"
          onClick={() => append(newSegment(getValues("segments")))}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          + Add segment
        </button>
      </div>
      {errors.segments?.message && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.segments.message}</p>
      )}
      {errors.segments?.root?.message && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.segments.root.message}</p>
      )}

      {fields.map((field, index) => (
        <SegmentCard
          key={field.rowId}
          form={form}
          index={index}
          last={index === fields.length - 1}
          materials={materials}
          materialsLoading={materialsLoading}
          fittings={fittings}
          hoseNozzles={hoseNozzles}
          referenceLoading={referenceLoading}
          referenceFailed={referenceFailed}
          onRemove={() => remove(index)}
          onMove={(by) => move(index, index + by)}
          removeDisabled={fields.length === 1}
        />
      ))}

      <FdcSection form={form} materials={materials} materialsLoading={materialsLoading} fittings={fittings} />

      <PathReferenceTables
        hoseNozzles={hoseNozzles}
        hoseNozzleNote={hoseNozzleNote}
        cFactors={cFactors}
        referenceEdition={referenceEdition}
      />
    </div>
  );
}
