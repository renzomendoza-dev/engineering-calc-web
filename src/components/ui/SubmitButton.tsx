interface SubmitButtonProps {
  isSubmitting: boolean;
  /** Idle label; most calculators use the default. */
  label?: string;
  /** Label while the request is in flight. */
  submittingLabel?: string;
}

/** The submit button every calculator form renders, disabled while its request is in flight. */
export function SubmitButton({
  isSubmitting,
  label = "Calculate",
  submittingLabel = "Calculating…",
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="self-start rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting ? submittingLabel : label}
    </button>
  );
}
