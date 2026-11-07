/**
 * The statuses of a compliance line, as the API's check DTOs send them, in the order the pages
 * count them. Shared by every calculator that shows a compliance table.
 */
export const CHECK_STATUSES = ["PASS", "FAIL", "CONFIRM", "OPEN", "INFO"] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

export const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  PASS: "Pass",
  FAIL: "Fail",
  CONFIRM: "Confirm",
  OPEN: "Open",
  INFO: "Info",
};

/** How many lines have each status, every status present (zero when none has it). */
export function countByStatus(checks: readonly { status: CheckStatus }[]): Record<CheckStatus, number> {
  const counts = Object.fromEntries(CHECK_STATUSES.map((status) => [status, 0])) as Record<CheckStatus, number>;
  for (const check of checks) counts[check.status] += 1;
  return counts;
}
