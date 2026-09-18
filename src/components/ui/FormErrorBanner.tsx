interface FormErrorBannerProps {
  /** Renders nothing when null or empty. */
  message: string | null;
}

/**
 * The form-level error banner every calculator form shows for errors that can't be pinned to a
 * single field (see useApiFormError). role="alert" makes screen readers announce it as soon as
 * it appears, since it shows up away from the submit button the user just pressed.
 */
export function FormErrorBanner({ message }: FormErrorBannerProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
    >
      {message}
    </div>
  );
}
