"use client";

import { useEffect, useState } from "react";
import {
  useFieldArray,
  useForm,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost, ApiError } from "@/lib/api-client";
import { useConduitFillReferenceData } from "@/hooks/useConduitFillReferenceData";
import { useConductorFillSizes } from "@/hooks/useConductorFillSizes";
import { conduitFillSchema, type ConduitFillFormInput, type ConduitFillFormValues } from "./schema";
import type { ConduitFillRequest, ConduitFillResponse } from "./types";

const defaultValues: ConduitFillFormInput = {
  conductors: [{ insulationType: "", sizeLabel: "", quantity: 1 }],
  conduitType: "",
};

interface ConductorEntryErrors {
  insulationType?: { message?: string };
  sizeLabel?: { message?: string };
  quantity?: { message?: string };
}

interface ConductorEntryRowProps {
  index: number;
  register: UseFormRegister<ConduitFillFormInput>;
  watch: UseFormWatch<ConduitFillFormInput>;
  setValue: UseFormSetValue<ConduitFillFormInput>;
  errors?: ConductorEntryErrors;
  insulationTypeOptions: SelectOption[];
  insulationTypesDisabled: boolean;
  onRemove: () => void;
  canRemove: boolean;
}

function ConductorEntryRow({
  index,
  register,
  watch,
  setValue,
  errors,
  insulationTypeOptions,
  insulationTypesDisabled,
  onRemove,
  canRemove,
}: ConductorEntryRowProps) {
  const insulationType = watch(`conductors.${index}.insulationType`);
  const { sizes, isLoading: sizesLoading, error: sizesError } = useConductorFillSizes(
    insulationType ?? "",
  );

  // Sizes are insulation-type-specific — clear a previously selected size (rather than
  // leaving a stale value in form state) whenever this row's insulation type changes.
  useEffect(() => {
    setValue(`conductors.${index}.sizeLabel`, "");
  }, [insulationType, index, setValue]);

  const sizeOptions: SelectOption[] = [
    {
      value: "",
      label: !insulationType
        ? "Select insulation type first"
        : sizesLoading
          ? "Loading…"
          : "Select a size",
    },
    ...sizes.map((size) => ({ value: size, label: size })),
  ];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-start">
      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField
          label="Insulation Type"
          options={insulationTypeOptions}
          disabled={insulationTypesDisabled}
          error={errors?.insulationType?.message}
          {...register(`conductors.${index}.insulationType`)}
        />
        <SelectField
          label="Conductor Size"
          options={sizeOptions}
          disabled={!insulationType || sizesLoading || !!sizesError}
          error={errors?.sizeLabel?.message ?? sizesError ?? undefined}
          {...register(`conductors.${index}.sizeLabel`)}
        />
        <NumberField
          label="Quantity"
          min={1}
          error={errors?.quantity?.message}
          {...register(`conductors.${index}.quantity`)}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="self-start rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        Remove
      </button>
    </div>
  );
}

interface ConduitFillFormProps {
  onResult: (result: ConduitFillResponse) => void;
}

export function ConduitFillForm({ onResult }: ConduitFillFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConduitFillFormInput, unknown, ConduitFillFormValues>({
    resolver: zodResolver(conduitFillSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "conductors" });

  const {
    insulationTypes,
    conduitFillTypes,
    isLoading: referenceLoading,
    error: referenceError,
  } = useConduitFillReferenceData();

  const referenceFieldsDisabled = referenceLoading || !!referenceError;

  const insulationTypeOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select insulation type" },
    ...insulationTypes.map((type) => ({ value: type, label: type })),
  ];
  const conduitTypeOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select conduit type" },
    ...conduitFillTypes.map((type) => ({ value: type, label: type })),
  ];

  const onSubmit = async (values: ConduitFillFormValues) => {
    setGeneralError(null);

    const request: ConduitFillRequest = {
      conductors: values.conductors,
      conduitType: values.conduitType,
    };

    try {
      const result = await apiPost<ConduitFillRequest, ConduitFillResponse>(
        "/api/electrical/conduit-fill",
        request,
      );
      onResult(result);
    } catch (err) {
      if (err instanceof ApiError) {
        const messages = err.fieldErrors ? Object.values(err.fieldErrors) : [err.message];
        setGeneralError(messages.join(" "));
      } else {
        setGeneralError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {referenceError && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load reference data ({referenceError}).
        </div>
      )}

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <ConductorEntryRow
            key={field.id}
            index={index}
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors.conductors?.[index]}
            insulationTypeOptions={insulationTypeOptions}
            insulationTypesDisabled={referenceFieldsDisabled}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}
        {errors.conductors?.root?.message && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.conductors.root.message}</p>
        )}
        <button
          type="button"
          onClick={() => append({ insulationType: "", sizeLabel: "", quantity: 1 })}
          className="self-start rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Add Conductor
        </button>
      </div>

      <SelectField
        label="Conduit Type"
        options={conduitTypeOptions}
        disabled={referenceFieldsDisabled}
        error={errors.conduitType?.message}
        {...register("conduitType")}
      />

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
