"use client";

import { useEffect } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { RowCard } from "@/features/sprinkler-hydraulics/RowList";
import { useMotorHorsepowerRatings } from "@/hooks/useMotorHorsepowerRatings";
import { useMotorVoltages } from "@/hooks/useMotorVoltages";
import type { GeneratorSetFormInput } from "./schema";
import {
  DIRECT_LOAD_KIND_LABELS,
  DIRECT_LOAD_KINDS,
  DIRECT_LOAD_UNIT_LABELS,
  DIRECT_LOAD_UNITS,
  type GeneratorSetReference,
} from "./types";

type Register = UseFormRegister<GeneratorSetFormInput>;
type Watch = UseFormWatch<GeneratorSetFormInput>;
type SetValue = UseFormSetValue<GeneratorSetFormInput>;
type Errors = FieldErrors<GeneratorSetFormInput>;

interface RowProps {
  index: number;
  register: Register;
  errors: Errors;
  onDuplicate: () => void;
  onRemove: () => void;
}

function CheckboxField({
  label,
  hint,
  registration,
}: {
  label: string;
  hint?: string;
  registration: ReturnType<Register>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
          {...registration}
        />
        {label}
      </label>
      {hint && <p className="pl-6 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

interface LightingAreaRowProps extends RowProps {
  watch: Watch;
  setValue: SetValue;
  reference: GeneratorSetReference;
  referenceDisabled: boolean;
}

export function LightingAreaRow({
  index,
  register,
  watch,
  setValue,
  errors,
  reference,
  referenceDisabled,
  onDuplicate,
  onRemove,
}: LightingAreaRowProps) {
  const rowErrors = errors.lightingAreas?.[index];
  const occupancyKey = watch(`lightingAreas.${index}.occupancy`);
  const areaTypeKey = watch(`lightingAreas.${index}.areaType`);
  const occupancy = reference.lightingOccupancies.find((entry) => entry.key === occupancyKey);
  const areaType = reference.lightingAreaTypes.find((entry) => entry.key === areaTypeKey);
  const isDwelling = occupancyKey === "DWELLING_UNITS";
  const tableUnitLoad = areaType?.voltAmperesPerM2 ?? occupancy?.voltAmperesPerM2;

  // Table 2.20.2.3's extra area types do not apply to dwelling units, so a stale choice is cleared.
  useEffect(() => {
    if (isDwelling) {
      setValue(`lightingAreas.${index}.areaType`, "GENERAL");
    }
  }, [isDwelling, index, setValue]);

  const occupancyOptions: SelectOption[] = [
    { value: "", label: referenceDisabled ? "Loading…" : "Select an occupancy" },
    ...reference.lightingOccupancies.map((entry) => ({ value: entry.key, label: entry.label })),
  ];
  const areaTypeOptions: SelectOption[] = reference.lightingAreaTypes.map((entry) => ({
    value: entry.key,
    label: entry.label,
  }));

  return (
    <RowCard
      title={`Lighting area ${index + 1}`}
      describedAs={`lighting area ${index + 1}`}
      onDuplicate={onDuplicate}
      onRemove={onRemove}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Name (optional)"
          error={rowErrors?.label?.message}
          {...register(`lightingAreas.${index}.label`)}
        />
        <SelectField
          label="Occupancy"
          options={occupancyOptions}
          disabled={referenceDisabled}
          error={rowErrors?.occupancy?.message}
          hint="Table 2.20.2.3"
          {...register(`lightingAreas.${index}.occupancy`)}
        />
        <SelectField
          label="Area type"
          options={
            areaTypeOptions.length > 0 ? areaTypeOptions : [{ value: "GENERAL", label: "—" }]
          }
          disabled={referenceDisabled || isDwelling}
          error={rowErrors?.areaType?.message}
          {...register(`lightingAreas.${index}.areaType`)}
        />
        <NumberField
          label="Floor area"
          unit="m²"
          hint="From the outside dimensions of the building (2.20.2.3)."
          error={rowErrors?.floorAreaM2?.message}
          {...register(`lightingAreas.${index}.floorAreaM2`)}
        />
        <NumberField
          label="Design unit load (optional)"
          unit="VA/m²"
          hint={
            tableUnitLoad === undefined
              ? "Blank uses the Table 2.20.2.3 value."
              : `Blank uses the table's ${tableUnitLoad} VA/m². A design value cannot be lower.`
          }
          error={rowErrors?.unitLoadVoltAmperesPerM2?.message}
          {...register(`lightingAreas.${index}.unitLoadVoltAmperesPerM2`)}
        />
      </div>
      {occupancy?.note && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{occupancy.note}</p>
      )}
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <CheckboxField
          label="Runs 3 hours or more"
          registration={register(`lightingAreas.${index}.continuous`)}
        />
        {occupancy?.fullDemandWhenAllLightingInUse && (
          <CheckboxField
            label="Entire lighting used at one time"
            hint="Operating rooms, ballrooms, dining rooms: no demand factor."
            registration={register(`lightingAreas.${index}.entireLightingUsedAtOnce`)}
          />
        )}
      </div>
    </RowCard>
  );
}

export function ReceptacleGroupRow({ index, register, errors, onDuplicate, onRemove }: RowProps) {
  const rowErrors = errors.receptacleGroups?.[index];
  return (
    <RowCard
      title={`Receptacle group ${index + 1}`}
      describedAs={`receptacle group ${index + 1}`}
      onDuplicate={onDuplicate}
      onRemove={onRemove}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Name (optional)"
          error={rowErrors?.label?.message}
          {...register(`receptacleGroups.${index}.label`)}
        />
        <NumberField
          label="Outlets"
          hint="Each single or multiple receptacle on one yoke counts as one (2.20.2.5(I))."
          error={rowErrors?.outlets?.message}
          {...register(`receptacleGroups.${index}.outlets`)}
        />
        <NumberField
          label="Bank or office floor area (optional)"
          unit="m²"
          hint="In a bank or office the load is the larger of 180 VA per outlet or 11 VA/m² (2.20.2.5(K))."
          error={rowErrors?.bankOrOfficeFloorAreaM2?.message}
          {...register(`receptacleGroups.${index}.bankOrOfficeFloorAreaM2`)}
        />
      </div>
      <CheckboxField
        label="Runs 3 hours or more"
        registration={register(`receptacleGroups.${index}.continuous`)}
      />
    </RowCard>
  );
}

export function OtherLoadRow({ index, register, errors, onDuplicate, onRemove }: RowProps) {
  const rowErrors = errors.otherLoads?.[index];
  return (
    <RowCard
      title={`Other load ${index + 1}`}
      describedAs={`other load ${index + 1}`}
      onDuplicate={onDuplicate}
      onRemove={onRemove}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Name"
          error={rowErrors?.label?.message}
          {...register(`otherLoads.${index}.label`)}
        />
        <NumberField
          label="Connected load"
          unit="VA"
          error={rowErrors?.voltAmperes?.message}
          {...register(`otherLoads.${index}.voltAmperes`)}
        />
        <NumberField
          label="Demand factor"
          unit="%"
          hint="The factor you apply to this load, at most 100."
          error={rowErrors?.demandFactorPercent?.message}
          {...register(`otherLoads.${index}.demandFactorPercent`)}
        />
      </div>
      <CheckboxField
        label="Runs 3 hours or more"
        registration={register(`otherLoads.${index}.continuous`)}
      />
    </RowCard>
  );
}

interface DirectLoadRowProps extends RowProps {
  watch: Watch;
}

const directKindOptions: SelectOption[] = DIRECT_LOAD_KINDS.map((value) => ({
  value,
  label: DIRECT_LOAD_KIND_LABELS[value],
}));
const directUnitOptions: SelectOption[] = DIRECT_LOAD_UNITS.map((value) => ({
  value,
  label: DIRECT_LOAD_UNIT_LABELS[value],
}));

/** A building's whole load, or a fire pump, entered as a figure instead of built up. */
export function DirectLoadRow({
  index,
  register,
  watch,
  errors,
  onDuplicate,
  onRemove,
}: DirectLoadRowProps) {
  const rowErrors = errors.directLoads?.[index];
  const kind = watch(`directLoads.${index}.kind`);
  const unit = watch(`directLoads.${index}.unit`);
  const isPump = kind === "FIRE_PUMP";

  return (
    <RowCard
      title={`Total load ${index + 1}`}
      describedAs={`total load ${index + 1}`}
      onDuplicate={onDuplicate}
      onRemove={onRemove}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Name (optional)"
          error={rowErrors?.label?.message}
          {...register(`directLoads.${index}.label`)}
        />
        <SelectField
          label="This load is"
          options={directKindOptions}
          error={rowErrors?.kind?.message}
          {...register(`directLoads.${index}.kind`)}
        />
        <NumberField
          label="Load"
          hint={
            isPump
              ? "The fire pump's running load, from its controller or nameplate."
              : "The building's total load. Enter it after your own demand factors; none is applied."
          }
          error={rowErrors?.amount?.message}
          {...register(`directLoads.${index}.amount`)}
        />
        <SelectField
          label="Unit"
          options={directUnitOptions}
          hint={unit === "AMPS" ? "Amperes at the system voltage." : undefined}
          error={rowErrors?.unit?.message}
          {...register(`directLoads.${index}.unit`)}
        />
        {unit === "KW" && (
          <NumberField
            label="Power factor"
            hint="Turns kW into kVA."
            error={rowErrors?.powerFactor?.message}
            {...register(`directLoads.${index}.powerFactor`)}
          />
        )}
        {isPump && (
          <>
            <NumberField
              label="Locked-rotor current (optional)"
              unit="A"
              hint="At the system voltage, from the controller or nameplate. Blank leaves the pump's starting out of the check."
              error={rowErrors?.lockedRotorAmps?.message}
              {...register(`directLoads.${index}.lockedRotorAmps`)}
            />
            <NumberField
              label="Start step"
              hint="Loads in the same step start together; a higher step starts once the lower ones are running."
              error={rowErrors?.startStep?.message}
              {...register(`directLoads.${index}.startStep`)}
            />
            <NumberField
              label="Starting current"
              unit="% of locked rotor"
              hint="100 for across-the-line starting."
              error={rowErrors?.startingCurrentPercent?.message}
              {...register(`directLoads.${index}.startingCurrentPercent`)}
            />
          </>
        )}
      </div>
      {!isPump && (
        <CheckboxField
          label="Runs 3 hours or more"
          registration={register(`directLoads.${index}.continuous`)}
        />
      )}
    </RowCard>
  );
}

interface MotorRowProps extends RowProps {
  watch: Watch;
  setValue: SetValue;
  phaseType: string;
  systemVoltage: number | undefined;
}

export function MotorRow({
  index,
  register,
  watch,
  setValue,
  errors,
  phaseType,
  systemVoltage,
  onDuplicate,
  onRemove,
}: MotorRowProps) {
  const rowErrors = errors.motors?.[index];
  const isThreePhase = phaseType === "THREE_PHASE";
  const horsepowerLabel = watch(`motors.${index}.horsepowerLabel`) ?? "";
  const voltage = String(watch(`motors.${index}.voltage`) ?? "");

  const {
    horsepowerRatings,
    isLoading: hpLoading,
    error: hpError,
  } = useMotorHorsepowerRatings(phaseType, isThreePhase ? "INDUCTION" : "", isThreePhase);
  const {
    voltages,
    isLoading: voltageLoading,
    error: voltageError,
  } = useMotorVoltages(phaseType, isThreePhase ? "INDUCTION" : "", isThreePhase, horsepowerLabel);

  // Pre-select the system voltage once the horsepower's published voltages are known, so a motor
  // on the generator's own voltage needs no second choice. Only fills an empty field.
  useEffect(() => {
    if (!voltage && systemVoltage && voltages.includes(systemVoltage)) {
      setValue(`motors.${index}.voltage`, String(systemVoltage));
    }
  }, [voltage, systemVoltage, voltages, index, setValue]);

  const horsepowerOptions: SelectOption[] = [
    { value: "", label: hpLoading ? "Loading…" : "Select horsepower" },
    ...horsepowerRatings.map((rating) => ({ value: rating, label: `${rating} hp` })),
  ];
  const voltageOptions: SelectOption[] = [
    {
      value: "",
      label: !horsepowerLabel
        ? "Select horsepower first"
        : voltageLoading
          ? "Loading…"
          : "Select voltage",
    },
    ...voltages.map((entry) => ({ value: String(entry), label: `${entry} V` })),
  ];

  const horsepowerRegistration = register(`motors.${index}.horsepowerLabel`, {
    onChange: () => setValue(`motors.${index}.voltage`, ""),
  });

  return (
    <RowCard
      title={`Motor ${index + 1}`}
      describedAs={`motor ${index + 1}`}
      onDuplicate={onDuplicate}
      onRemove={onRemove}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Name (optional)"
          error={rowErrors?.label?.message}
          {...register(`motors.${index}.label`)}
        />
        <NumberField
          label="Quantity"
          hint="Identical motors that run together."
          error={rowErrors?.quantity?.message}
          {...register(`motors.${index}.quantity`)}
        />
        <SelectField
          label="Horsepower"
          options={horsepowerOptions}
          disabled={hpLoading || !!hpError}
          error={rowErrors?.horsepowerLabel?.message ?? hpError ?? undefined}
          {...horsepowerRegistration}
        />
        <SelectField
          label="Motor voltage"
          options={voltageOptions}
          disabled={!horsepowerLabel || voltageLoading || !!voltageError}
          error={rowErrors?.voltage?.message ?? voltageError ?? undefined}
          hint="Voltages with a published full-load current at this horsepower."
          {...register(`motors.${index}.voltage`)}
        />
        <NumberField
          label="Start step"
          hint="Motors in the same step start together; a higher step starts once the lower ones are running."
          error={rowErrors?.startStep?.message}
          {...register(`motors.${index}.startStep`)}
        />
        <NumberField
          label="Starting current"
          unit="% of locked rotor"
          hint="100 for across-the-line starting; less where a starter or drive holds the current down."
          error={rowErrors?.startingCurrentPercent?.message}
          {...register(`motors.${index}.startingCurrentPercent`)}
        />
      </div>
    </RowCard>
  );
}
