"use client";

import { useEffect } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { RadioGroupField, type RadioOption } from "@/components/ui/RadioGroupField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { useMotorHorsepowerRatings } from "@/hooks/useMotorHorsepowerRatings";
import { useMotorVoltages } from "@/hooks/useMotorVoltages";
import type { useWireSizingReferenceData } from "@/hooks/useWireSizingReferenceData";
import { CONDUIT_MATERIALS } from "@/features/voltage-drop/types";
import { ConductorFields } from "./ConductorFields";
import { CheckboxField } from "./LoadInputs";
import type { GeneratorSetFormInput } from "./schema";
import type { GeneratorSetReference } from "./types";

type Register = UseFormRegister<GeneratorSetFormInput>;
type Watch = UseFormWatch<GeneratorSetFormInput>;
type SetValue = UseFormSetValue<GeneratorSetFormInput>;
type Errors = FieldErrors<GeneratorSetFormInput>;

const pumpEntryOptions: RadioOption[] = [
  { value: "HORSEPOWER", label: "By horsepower (PEC tables)" },
  { value: "AMPERES", label: "By current (controller or nameplate)" },
];

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

interface PumpMotorFieldsProps {
  /** Which pump of the fire pump section this is. */
  pump: "motor" | "jockey";
  title: string;
  /** Only the fire pump motor takes a locked-rotor current; the jockey's is not used. */
  allowLockedRotor: boolean;
  register: Register;
  watch: Watch;
  setValue: SetValue;
  errors: Errors;
  phaseType: string;
  systemVoltage: number | undefined;
}

/**
 * One pump, entered either from the PEC horsepower tables or as the currents from its controller. The
 * horsepower and voltage lists are the same lookups motors use, so only combinations with a published
 * full-load current can be picked.
 */
function PumpMotorFields({
  pump,
  title,
  allowLockedRotor,
  register,
  watch,
  setValue,
  errors,
  phaseType,
  systemVoltage,
}: PumpMotorFieldsProps) {
  const pumpErrors = errors.firePump?.[pump];
  const isThreePhase = phaseType === "THREE_PHASE";
  const entry = watch(`firePump.${pump}.entry`);
  const horsepowerLabel = watch(`firePump.${pump}.horsepowerLabel`) ?? "";
  const voltage = String(watch(`firePump.${pump}.voltage`) ?? "");
  const byHorsepower = entry === "HORSEPOWER";

  const {
    horsepowerRatings,
    isLoading: hpLoading,
    error: hpError,
  } = useMotorHorsepowerRatings(phaseType, isThreePhase ? "INDUCTION" : "", isThreePhase);
  const {
    voltages,
    isLoading: voltageLoading,
    error: voltageError,
  } = useMotorVoltages(
    phaseType,
    isThreePhase ? "INDUCTION" : "",
    isThreePhase,
    byHorsepower ? horsepowerLabel : "",
  );

  // Pre-select the system voltage once the horsepower's published voltages are known; fills an empty field only.
  useEffect(() => {
    if (byHorsepower && !voltage && systemVoltage && voltages.includes(systemVoltage)) {
      setValue(`firePump.${pump}.voltage`, String(systemVoltage));
    }
  }, [byHorsepower, voltage, systemVoltage, voltages, pump, setValue]);

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
    ...voltages.map((value) => ({ value: String(value), label: `${value} V` })),
  ];

  const horsepowerRegistration = register(`firePump.${pump}.horsepowerLabel`, {
    onChange: () => setValue(`firePump.${pump}.voltage`, ""),
  });

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <RadioGroupField
        legend={title}
        options={pumpEntryOptions}
        {...register(`firePump.${pump}.entry`)}
      />
      {byHorsepower ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Horsepower"
            options={horsepowerOptions}
            disabled={hpLoading || !!hpError}
            error={pumpErrors?.horsepowerLabel?.message ?? hpError ?? undefined}
            {...horsepowerRegistration}
          />
          <SelectField
            label="Motor voltage"
            options={voltageOptions}
            disabled={!horsepowerLabel || voltageLoading || !!voltageError}
            error={pumpErrors?.voltage?.message ?? voltageError ?? undefined}
            hint="Voltages with a published full-load current at this horsepower."
            {...register(`firePump.${pump}.voltage`)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Full-load current"
            unit="A"
            hint="At the system voltage."
            error={pumpErrors?.fullLoadAmps?.message}
            {...register(`firePump.${pump}.fullLoadAmps`)}
          />
          {allowLockedRotor && (
            <NumberField
              label="Locked-rotor current (optional)"
              unit="A"
              hint="At the system voltage. Blank leaves the pump's starting out of the check."
              error={pumpErrors?.lockedRotorAmps?.message}
              {...register(`firePump.${pump}.lockedRotorAmps`)}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface FirePumpSectionProps {
  register: Register;
  watch: Watch;
  setValue: SetValue;
  errors: Errors;
  phaseType: string;
  systemVoltage: number | undefined;
  reference: GeneratorSetReference;
  wireReference: ReturnType<typeof useWireSizingReferenceData>;
}

/**
 * A fire pump the generator carries as the alternate source (PEC Article 6.95): the pump, an optional
 * pressure maintenance (jockey) pump, accessories, and the run of conductors to its controller with
 * its voltage drop. Offered whichever way the building's load is entered.
 */
export function FirePumpSection({
  register,
  watch,
  setValue,
  errors,
  phaseType,
  systemVoltage,
  reference,
  wireReference,
}: FirePumpSectionProps) {
  const includeFirePump = watch("includeFirePump");
  const includeJockey = watch("firePump.includeJockey");
  const sizeSupplyRun = watch("firePump.sizeSupplyRun");
  const checkVoltageDrop = watch("firePump.supplyRun.checkVoltageDrop");
  const runErrors = errors.firePump?.supplyRun;

  // Start the voltage drop check from the API's defaults when it is switched on, filling blank fields only.
  const startingPowerFactor = watch("firePump.supplyRun.startingPowerFactor");
  const runningPowerFactor = watch("firePump.supplyRun.runningPowerFactor");
  const allowance = watch("firePump.supplyRun.cableStartingDropAllowancePercent");
  useEffect(() => {
    if (!checkVoltageDrop) return;
    if (startingPowerFactor === undefined || startingPowerFactor === "") {
      setValue(
        "firePump.supplyRun.startingPowerFactor",
        reference.defaultFirePumpStartingPowerFactor,
      );
    }
    if (runningPowerFactor === undefined || runningPowerFactor === "") {
      setValue(
        "firePump.supplyRun.runningPowerFactor",
        reference.defaultFirePumpRunningPowerFactor,
      );
    }
    if (allowance === undefined || allowance === "") {
      setValue(
        "firePump.supplyRun.cableStartingDropAllowancePercent",
        reference.defaultCableStartingDropAllowancePercent,
      );
    }
  }, [
    checkVoltageDrop,
    startingPowerFactor,
    runningPowerFactor,
    allowance,
    reference.defaultFirePumpStartingPowerFactor,
    reference.defaultFirePumpRunningPowerFactor,
    reference.defaultCableStartingDropAllowancePercent,
    setValue,
  ]);

  const conduitOptions: SelectOption[] = [
    { value: "", label: "Select a material" },
    ...CONDUIT_MATERIALS.map((material) => ({ value: material, label: titleCase(material) })),
  ];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Fire pump</h2>
      <CheckboxField
        label="A fire pump is supplied by this generator"
        hint="Adds the pump to the load and applies PEC Article 6.95: starting against the building load, the conductors to its controller and their voltage drop."
        registration={register("includeFirePump")}
      />

      {includeFirePump && (
        <>
          <PumpMotorFields
            pump="motor"
            title="Fire pump motor"
            allowLockedRotor
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
            phaseType={phaseType}
            systemVoltage={systemVoltage}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="Start step"
              hint="Loads in the same step start together; a higher step starts once the lower ones are running."
              error={errors.firePump?.startStep?.message}
              {...register("firePump.startStep")}
            />
            <NumberField
              label="Starting current"
              unit="% of locked rotor"
              hint="100 for across-the-line starting; fire pump controllers often start at less."
              error={errors.firePump?.startingCurrentPercent?.message}
              {...register("firePump.startingCurrentPercent")}
            />
          </div>

          <CheckboxField
            label="There is a pressure maintenance (jockey) pump on the same supply"
            hint="Taken as running before the fire pump starts; its full-load current adds to the conductor ampacity (6.95.1.6(B)(1))."
            registration={register("firePump.includeJockey")}
          />
          {includeJockey && (
            <PumpMotorFields
              pump="jockey"
              title="Pressure maintenance pump"
              allowLockedRotor={false}
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              phaseType={phaseType}
              systemVoltage={systemVoltage}
            />
          )}

          <NumberField
            label="Accessory equipment (optional)"
            unit="A"
            hint="Full-load current of the associated fire pump accessory equipment at the system voltage, at 100%."
            error={errors.firePump?.accessoryAmps?.message}
            {...register("firePump.accessoryAmps")}
          />

          <CheckboxField
            label="Size the conductors from the generator to the fire pump controller"
            hint="At least 125% of the pump and jockey full-load currents plus 100% of the accessories (6.95.1.6(B))."
            registration={register("firePump.sizeSupplyRun")}
          />
          {sizeSupplyRun && (
            <>
              <ConductorFields
                prefix="firePump.supplyRun"
                register={register}
                errors={runErrors}
                wireReference={wireReference}
                parallelHint="More than one set may be needed to hold the voltage drop."
              />
              <CheckboxField
                label="Check the voltage drop of the run"
                hint="At most 15% below normal at the controller when starting, and 5% running at 115% of full load (6.95.1.7). The conductor is made larger if the drop needs it."
                registration={register("firePump.supplyRun.checkVoltageDrop")}
              />
              {checkVoltageDrop && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-2 dark:border-zinc-800">
                    <NumberField
                      label="Length of the run"
                      unit="m"
                      hint="One way, from the generator to the controller."
                      error={runErrors?.oneWayLengthMeters?.message}
                      {...register("firePump.supplyRun.oneWayLengthMeters")}
                    />
                    <SelectField
                      label="Conduit material"
                      options={conduitOptions}
                      error={runErrors?.conduitMaterial?.message}
                      {...register("firePump.supplyRun.conduitMaterial")}
                    />
                    <NumberField
                      label="Pump power factor at starting"
                      error={runErrors?.startingPowerFactor?.message}
                      {...register("firePump.supplyRun.startingPowerFactor")}
                    />
                    <NumberField
                      label="Pump power factor at 115% of full load"
                      error={runErrors?.runningPowerFactor?.message}
                      {...register("firePump.supplyRun.runningPowerFactor")}
                    />
                    <NumberField
                      label="Cable's share of the 15% starting drop"
                      unit="%"
                      hint="The conductor is sized to stay within it; the generator gets what the cable leaves."
                      error={runErrors?.cableStartingDropAllowancePercent?.message}
                      {...register("firePump.supplyRun.cableStartingDropAllowancePercent")}
                    />
                  </div>
                  {reference.firePumpDefaultsNote && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {reference.firePumpDefaultsNote}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
