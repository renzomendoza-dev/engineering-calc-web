"use client";

import { NumberField } from "@/components/ui/NumberField";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { CLASS_LABELS, EDITION_NOTICE, HAZARD_LABELS, INLET_OPTION_LABELS, PROTECTION_LABELS } from "../labels";
import type { StepProps } from "../stepProps";
import {
  COMBINED_HAZARDS,
  INLET_SIZES,
  SPRINKLER_PROTECTIONS,
  STANDPIPE_CLASSES,
  type StandpipeClass,
} from "../types";

const CLASS_OPTIONS = STANDPIPE_CLASSES.map((value) => ({ value, label: CLASS_LABELS[value] }));
const PROTECTION_OPTIONS = SPRINKLER_PROTECTIONS.map((value) => ({
  value,
  label: PROTECTION_LABELS[value],
}));
const INLET_OPTIONS = INLET_SIZES.map((value) => ({ value, label: INLET_OPTION_LABELS[value] }));
const HAZARD_OPTIONS = [
  { value: "", label: "Choose…" },
  ...COMBINED_HAZARDS.map((value) => ({ value, label: HAZARD_LABELS[value] })),
];

interface ClassNote {
  value: StandpipeClass;
  who: string;
  flow: string;
}

/**
 * What each class is for, to help choose one. Wording follows clause 8.2 of the 2024 edition; the
 * flows are those of 10.6. Explanation only: the API applies the rules, and the AHJ decides which
 * class a building needs (4.1.1).
 */
const CLASS_NOTES: ClassNote[] = [
  {
    value: "CLASS_I",
    who: "2.5 in. hose connections to supply water for use by fire departments and by those trained in handling heavy fire streams (8.2.1).",
    flow: "500 gpm at the most remote standpipe (250 gpm at each of two connections), plus 250 gpm for each additional standpipe.",
  },
  {
    value: "CLASS_II",
    who: "1.5 in. hose stations to supply water for use by trained personnel, or a hose connection for the fire department during initial response (8.2.2.1). Each connection for trained personnel is equipped with no more than 100 ft of listed, lined 1.5 in. hose ready for use (7.6.2.1).",
    flow: "100 gpm at the most remote hose connection, and no extra flow where there is more than one connection.",
  },
  {
    value: "CLASS_III",
    who: "Both: 1.5 in. hose stations for use by trained personnel and 2.5 in. hose connections for the fire department and those trained in handling heavy streams (8.2.3).",
    flow: "Same flow as Class I.",
  },
];

function ClassGuide({ selected }: { selected: StandpipeClass }) {
  return (
    <span className="mt-1 flex flex-col gap-2">
      {CLASS_NOTES.map((note) => (
        <span
          key={note.value}
          className={`block rounded-md border px-3 py-2 text-xs ${
            note.value === selected
              ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
              : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
          }`}
        >
          <span className="block font-semibold">{CLASS_LABELS[note.value].split(":")[0]}</span>
          <span className="block">{note.who}</span>
          <span className="block">
            <span className="font-medium">Flow:</span> {note.flow}
          </span>
        </span>
      ))}
      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
        The authority having jurisdiction decides the class and type of system a building needs (4.1.1),
        so ask it if you are unsure. For Class III in a building sprinklered throughout, the 1.5 in.
        hose stations may be left out, subject to the AHJ, if each 2.5 in. connection has a 2.5 x
        1.5 in. reducer and a cap on a chain (8.2.3.2). Clause numbers are from the 2024 edition.
      </span>
    </span>
  );
}

/**
 * Step 1: the design basis. These choices fix the flow the system must deliver; the API applies the
 * rules of NFPA 14 to them, and the page only collects them.
 */
export function BasisStep({ form }: StepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const standpipeClass = watch("standpipeClass");
  const protection = watch("sprinklerProtection");
  const sprinklered = protection !== "NONE";
  const classIOrIII = standpipeClass !== "CLASS_II";
  const riserLevels = watch("risersEndAtDifferentLevels");

  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
        {EDITION_NOTICE}
      </p>

      <TextField
        label="Project name"
        hint="For your own reference. It is not part of the calculation."
        error={errors.projectName?.message}
        {...register("projectName")}
      />

      <RadioGroupField
        legend="Class of system"
        options={CLASS_OPTIONS}
        hint={<ClassGuide selected={standpipeClass} />}
        {...register("standpipeClass")}
      />

      <RadioGroupField
        legend="Sprinkler protection"
        options={PROTECTION_OPTIONS}
        hint="Decides how a sprinkler demand combines with the standpipe demand."
        {...register("sprinklerProtection")}
      />

      {sprinklered && (
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <NumberField
            label="Sprinkler demand"
            unit="gpm"
            hint="Hydraulically calculated, including its hose stream. Blank leaves it out."
            error={errors.sprinklerDemandGpm?.message}
            {...register("sprinklerDemandGpm")}
          />
          {protection === "PARTIAL" && (
            <SelectField
              label="Hazard of the sprinklered part"
              options={HAZARD_OPTIONS}
              hint="Caps the sprinkler allowance added to the standpipe flow."
              error={errors.sprinklerHazard?.message}
              {...register("sprinklerHazard")}
            />
          )}
        </div>
      )}

      {classIOrIII && (
        <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Standpipes in the building</h3>
          <div className="grid items-end gap-4 sm:grid-cols-2">
            <NumberField
              label="Additional standpipes"
              hint="Besides the hydraulically most remote one that the pipe path follows."
              error={errors.additionalStandpipes?.message}
              {...register("additionalStandpipes")}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" {...register("floorAreaOver80000SqFt")} />
            Floors exceed 80,000 sq ft each
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" {...register("horizontalStandpipeOnThreeConnections")} />
            A horizontal standpipe serves three or more hose connections on a floor
          </label>
          <div className="grid items-end gap-4 sm:grid-cols-2">
            <NumberField
              label="Laterals serving a single hose connection"
              hint="Each one is counted as a separate standpipe for the flow (10.6.1.1.7). Leave at 0 if none."
              error={errors.singleConnectionLaterals?.message}
              {...register("singleConnectionLaterals")}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" {...register("risersEndAtDifferentLevels")} />
            The standpipes end at different floor levels
          </label>
          {riserLevels && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              This calculation follows one path. Run it once for the standpipes on each level, counting
              only the standpipes that exist on that level as additional standpipes (10.6.1.2.1.1 and
              10.6.1.2.1.2).
            </p>
          )}
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Supply</h3>
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <NumberField
            label={classIOrIII ? "Flow added at the supply (optional)" : "Flow added at the supply"}
            unit="gpm"
            hint={
              classIOrIII
                ? "Leave blank. The other standpipes and the sprinkler allowance are worked out from the flow rules (10.6) and shown in the results. Enter a figure only to use a larger one."
                : "Sprinkler flow or other flow drawn from this supply. The pages read give no rule for combining it with a Class II system, so none is assumed: blank adds nothing."
            }
            error={errors.flowAddedAtSupplyGpm?.message}
            {...register("flowAddedAtSupplyGpm")}
          />
          <NumberField
            label="Supply duration"
            unit="min"
            placeholder="30"
            hint="Blank takes 30 minutes."
            error={errors.supplyDurationMinutes?.message}
            {...register("supplyDurationMinutes")}
          />
          <SelectField
            label="Fire department connection inlet size"
            options={INLET_OPTIONS}
            hint="A large inlet carries more flow, so fewer are needed (10.7.3.1). Check the hose pressure limit before choosing one."
            error={errors.fireDepartmentConnectionInletSize?.message}
            {...register("fireDepartmentConnectionInletSize")}
          />
          <NumberField
            label="Fire department connection inlets provided"
            hint="Inlets of the size above. Blank leaves the check as information."
            error={errors.fireDepartmentConnectionInlets?.message}
            {...register("fireDepartmentConnectionInlets")}
          />
          <NumberField
            label="Static pressure at the supply"
            unit="psi"
            hint="The highest static (nonflowing) pressure at the base of the system. For a fire pump it is the pump boost at churn plus the supply pressure at the suction (A.10.2). Blank leaves the 175 psi and 400 psi static checks open."
            error={errors.supplyStaticPressurePsi?.message}
            {...register("supplyStaticPressurePsi")}
          />
          <NumberField
            label="Height of the lowest hose connection above the supply"
            unit="ft"
            hint="Where the static pressure is highest. Blank takes 0, the supply level. Negative if it is below the supply."
            error={errors.lowestHoseConnectionHeightFt?.message}
            {...register("lowestHoseConnectionHeightFt")}
          />
        </div>
        {classIOrIII && (
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" {...register("manualSystem")} />
            Manual system: the water comes from the fire department through the fire department connection
          </label>
        )}
      </section>
    </div>
  );
}
