import type { UseFormReturn } from "react-hook-form";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";
import type { StandpipeFormInput, StandpipeFormValues } from "./schema";
import type { StandpipeCFactorEntry, StandpipeFittingEntry } from "./types";

/** The single react-hook-form instance shared by every step. */
export type StandpipeForm = UseFormReturn<StandpipeFormInput, unknown, StandpipeFormValues>;

export interface StepProps {
  form: StandpipeForm;
  materials: PipeMaterialOption[];
  materialsLoading: boolean;
  fittings: StandpipeFittingEntry[];
  cFactors: StandpipeCFactorEntry[];
  /** Edition the reference tables were read from, as the API reports it. */
  referenceEdition: string;
}
