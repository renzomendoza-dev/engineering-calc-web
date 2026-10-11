import type { SelectOption } from "@/components/ui/SelectField";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";

/**
 * Dropdown options over the shared pipe catalog (the same reference data the pipe velocity
 * calculator uses). The sprinkler API takes the machine key — `material`, `schedule`,
 * `nominalSize` — while the catalog's `materialName`/`nominalLabel` are what the user reads;
 * these helpers keep that pairing in one place.
 */
export function materialOptions(materials: PipeMaterialOption[]): SelectOption[] {
  return materials.map((material) => ({ value: material.material, label: material.materialName }));
}

export function scheduleOptions(materials: PipeMaterialOption[], material: string): SelectOption[] {
  const schedules = materials.find((entry) => entry.material === material)?.schedules ?? [];
  return schedules.map((schedule) => ({ value: schedule.schedule, label: schedule.schedule }));
}

export function sizeOptions(
  materials: PipeMaterialOption[],
  material: string,
  schedule: string | undefined,
): SelectOption[] {
  const schedules = materials.find((entry) => entry.material === material)?.schedules ?? [];
  const selected = schedules.find((entry) => entry.schedule === schedule) ?? schedules[0];
  return (selected?.sizes ?? []).map((size) => ({ value: size.nominalSize, label: size.nominalLabel }));
}
