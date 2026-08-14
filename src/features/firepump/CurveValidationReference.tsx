export function CurveValidationReference() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Compliance Rules</h2>
      <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        <li>
          Churn (shutoff, 0 GPM) pressure must not exceed <strong>140%</strong> of rated pressure.
        </li>
        <li>
          At <strong>150%</strong> of rated flow, pressure must be at least <strong>65%</strong> of
          rated pressure.
        </li>
        <li>
          Curve points must span from 0 GPM through at least 150% of the candidate&apos;s rated flow.
        </li>
      </ul>
    </div>
  );
}
