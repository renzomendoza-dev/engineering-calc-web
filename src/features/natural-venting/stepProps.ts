import type { UseFormReturn } from "react-hook-form";
import type { NaturalVentingFormInput, NaturalVentingFormValues } from "./schema";

/** The single react-hook-form instance shared by every step. */
export type NaturalVentingForm = UseFormReturn<
  NaturalVentingFormInput,
  unknown,
  NaturalVentingFormValues
>;

export interface StepProps {
  form: NaturalVentingForm;
}
