import type { UseFormReturn } from "react-hook-form";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";
import type { UseSprinklerReferenceDataResult } from "@/hooks/useSprinklerReferenceData";
import type { RemoteAreaPlanState } from "./useRemoteAreaPlan";
import type { SprinklerFormInput, SprinklerFormValues } from "./schema";
import type { SprinklerFlowRow } from "./types";

/** The single react-hook-form instance shared by every step. */
export type SprinklerForm = UseFormReturn<SprinklerFormInput, unknown, SprinklerFormValues>;

export interface StepProps {
  form: SprinklerForm;
  reference: UseSprinklerReferenceDataResult;
  /** The pipe material/schedule/size catalog, reused from the pipe velocity calculator. */
  materials: PipeMaterialOption[];
  materialsLoading: boolean;
  /**
   * The remote area plan, worked out on the API from the design basis (steps 1 and 2) and the
   * spacing entered in the pipe network step. Lives here rather than inside that step so the
   * design data step can show what it needs from it too.
   */
  plan: RemoteAreaPlanState;
  /**
   * The restored draft held its pipe network in the previous layout (separate sprinkler and pipe
   * lists), which can't be mapped onto branches. The network step says so rather than showing an
   * empty list without explanation.
   */
  legacyNetworkDropped: boolean;
  /**
   * What each listed sprinkler discharges, by node id, from the live calculation. Empty until a
   * calculation has completed.
   */
  sprinklerFlows: Record<string, SprinklerFlowRow>;
  /** True when those figures no longer match the input: being edited, or not yet sendable. */
  flowsStale: boolean;
}
