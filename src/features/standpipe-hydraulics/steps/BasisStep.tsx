"use client";

import { NumberField } from "@/components/ui/NumberField";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { CLASS_LABELS, EDITION_NOTICE, HAZARD_LABELS, PROTECTION_LABELS } from "../labels";
import type { StepProps } from "../stepProps";
import {
  COMBINED_HAZARDS,
  SPRINKLER_PROTECTIONS,
  STANDPIPE_CLASSES,
  type StandpipeClass,
} from "../types";

const CLASS_OPTIONS = STANDPIPE_CLASSES.map((value) => ({ value, label: CLASS_LABELS[value] }));
const PROTECTION_OPTIONS = SPRINKLER_PROTECTIONS.map((value) => ({
  value,
  label: PROTECTION_LABELS[value],
}));
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
 * What each class is for, to help choose one. Wording follows clause 5.3 of the 2019 edition; the
 * flows are those of 7.10. Explanation only: the API applies the rules, and the AHJ decides which
 * class a building needs (5.1.2).
 */
const CLASS_NOTES: ClassNote[] = [
  {
    value: "CLASS_I",
    who: "2.5 in. hose connections to supply water for use by fire departments and by those trained in handling heavy fire streams (5.3.1).",
    flow: "500 gpm at the most remote standpipe (250 gpm at each of two connections), plus 250 gpm for each additional standpipe.",
  },
  {
    value: "CLASS_II",
    who: "1.5 in. hose stations to supply water for use by trained personnel, or a hose connection for the fire department during initial response (5.3.2.1). Each station carries lined hose of 100 ft or less ready for use (4.6.2.1).",
    flow: "100 gpm at the most remote hose connection, and no extra flow where there is more than one connection.",
  },
  {
    value: "CLASS_III",
    who: "Both: 1.5 in. hose stations for use by trained personnel and 2.5 in. hose connections for the fire department and those trained in handling heavy streams (5.3.3).",
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
        The authority having jurisdiction decides the class and type of system a building needs (5.1.2),
        so ask it if you are unsure. For Class III in a building sprinklered throughout, the 1.5 in.
        hose stations may be left out, subject to the AHJ, if each 2.5 in. connection has a 2.5 x
        1.5 in. reducer and a cap on a chain (5.3.3.2). Clause numbers are from the 2019 edition.
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
                ? "Leave blank. The other standpipes and the sprinkler allowance are worked out from the flow rules (7.10) and shown in the results. Enter a figure only to use a larger one."
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
          <NumberField
            label="Fire department connection inlets provided"
            hint="2.5 in. inlets. Blank leaves the check as information."
            error={errors.fireDepartmentConnectionInlets?.message}
            {...register("fireDepartmentConnectionInlets")}
          />
        </div>
      </section>
    </div>
  );
}
