import type { UseFormReturn } from "react-hook-form";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";
import type { UseSprinklerReferenceDataResult } from "@/hooks/useSprinklerReferenceData";
import type { SprinklerFormInput, SprinklerFormValues } from "./schema";

/** The single react-hook-form instance shared by all five steps. */
export type SprinklerForm = UseFormReturn<SprinklerFormInput, unknown, SprinklerFormValues>;

export interface StepProps {
  form: SprinklerForm;
  reference: UseSprinklerReferenceDataResult;
  /** The pipe material/schedule/size catalog, reused from the pipe velocity calculator. */
  materials: PipeMaterialOption[];
  materialsLoading: boolean;
}
