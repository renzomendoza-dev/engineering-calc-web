"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost, ApiError } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { pressureTankSchema, type PressureTankFormInput, type PressureTankFormValues } from "./schema";
import type { PressureTankRequest, PressureTankResponse, PumpControlType } from "./types";

const defaultValues: PressureTankFormInput = {
  controlType: "CONVENTIONAL",
  drawdownFlowRateLpm: 0,
  minRunTimeMinutes: 0,
  lowPressureGaugeKpa: 0,
  highPressureGaugeKpa: 0,
  altitudeMeters: 0,
};

/**
 * The same four fields carry different real-world meaning depending on controlType (mirrors
 * calc-api's PressureTankRequest Javadoc) -- this lookup is the whole point of this page's UX,
 * per the task brief: without it the form looks identical between modes and the reason VFD
 * tanks come out smaller is invisible to the user.
 */
const LABELS: Record<
  PumpControlType,
  { flowRate: string; runTime: string; runTimeHint: string; low: string; high: string }
> = {
  CONVENTIONAL: {
    flowRate: "Full Pump Flow Rate",
    runTime: "Minimum Run Time",
    runTimeHint: "To avoid short-cycling.",
    low: "Cut-in Pressure",
    high: "Cut-out Pressure",
  },
  VFD: {
    flowRate: "Minimum Controllable Flow Rate",
    runTime: "Minimum Sleep Duration",
    runTimeHint: "Minimum time the pump is allowed to sleep before waking.",
    low: "Sleep Threshold Pressure",
    high: "Wake Threshold Pressure",
  },
};

const HIGH_AT_OR_BELOW_LOW_MESSAGE = "highPressureGauge must be greater than lowPressureGauge";

function tailoredPressureOrderMessage(controlType: PumpControlType): string {
  return controlType === "VFD"
    ? "Wake threshold pressure must be greater than sleep threshold pressure — otherwise the VFD would never sleep."
    : "Cut-out pressure must be greater than cut-in pressure — otherwise the pump would never turn off.";
}

interface PressureTankFormProps {
  onResult: (result: PressureTankResponse, request: PressureTankRequest) => void;
}

export function PressureTankForm({ onResult }: PressureTankFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PressureTankFormInput, unknown, PressureTankFormValues>({
    resolver: zodResolver(pressureTankSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const controlType = watch("controlType");
  const labels = LABELS[controlType];

  const onSubmit = async (values: PressureTankFormValues) => {
    setGeneralError(null);

    const request: PressureTankRequest = {
      controlType: values.controlType,
      drawdownFlowRateLpm: values.drawdownFlowRateLpm,
      minRunTimeMinutes: values.minRunTimeMinutes,
      lowPressureGaugeKpa: values.lowPressureGaugeKpa,
      highPressureGaugeKpa: values.highPressureGaugeKpa,
      altitudeMeters: values.altitudeMeters,
    };

    try {
      const result = await apiPost<PressureTankRequest, PressureTankResponse>(
        "/api/mechanical/tank/pressure",
        request,
      );
      onResult(result, request);
    } catch (err) {
      if (err instanceof ApiError && err.message.includes(HIGH_AT_OR_BELOW_LOW_MESSAGE)) {
        setGeneralError(tailoredPressureOrderMessage(values.controlType));
      } else {
        handleApiError(err);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Pump Control Type</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="CONVENTIONAL" className="h-4 w-4" {...register("controlType")} />
            Conventional (pressure switch)
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="VFD" className="h-4 w-4" {...register("controlType")} />
            VFD (variable speed)
          </label>
        </div>
      </div>

      <NumberField
        label={`${labels.flowRate} (L/min)`}
        error={errors.drawdownFlowRateLpm?.message}
        {...register("drawdownFlowRateLpm")}
      />

      <NumberField
        label={`${labels.runTime} (minutes)`}
        hint={labels.runTimeHint}
        error={errors.minRunTimeMinutes?.message}
        {...register("minRunTimeMinutes")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label={`${labels.low} (kPa)`}
          error={errors.lowPressureGaugeKpa?.message}
          {...register("lowPressureGaugeKpa")}
        />
        <NumberField
          label={`${labels.high} (kPa)`}
          error={errors.highPressureGaugeKpa?.message}
          {...register("highPressureGaugeKpa")}
        />
      </div>

      <NumberField
        label="Altitude"
        unit="m"
        hint="Affects the gauge-to-absolute pressure conversion used internally."
        error={errors.altitudeMeters?.message}
        {...register("altitudeMeters")}
      />

      {generalError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {generalError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Calculating…" : "Calculate"}
      </button>
    </form>
  );
}
