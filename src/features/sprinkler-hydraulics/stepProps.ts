import type { UseFormReturn } from "react-hook-form";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";
import type { UseSprinklerReferenceDataResult } from "@/hooks/useSprinklerReferenceData";
import type { RemoteAreaPlanState } from "./useRemoteAreaPlan";
import type { SprinklerFormInput, SprinklerFormValues } from "./schema";

/** The single react-hook-form instance shared by every step. */
export type SprinklerForm = UseFormReturn<SprinklerFormInput, unknown, SprinklerFormValues>;

export interface StepProps {
  form: SprinklerForm;
  reference: UseSprinklerReferenceDataResult;
  /** The pipe material/schedule/size catalog, reused from the pipe velocity calculator. */
  materials: PipeMaterialOption[];
  materialsLoading: boolean;
  /**
   * The remote area plan, worked out on the API from steps 1-3. Lives here rather than inside the
   * remote area step so the pipe network step can compare the sprinklers listed against it.
   */
  plan: RemoteAreaPlanState;
  /**
   * The restored draft held its pipe network in the previous layout (separate sprinkler and pipe
   * lists), which can't be mapped onto branches. The network step says so rather than showing an
   * empty list without explanation.
   */
  legacyNetworkDropped: boolean;
}
