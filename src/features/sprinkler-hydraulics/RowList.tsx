"use client";

import type { ReactNode } from "react";

interface RowListProps {
  /** Singular noun for the rows, e.g. "sprinkler" — used for the count line and the Add button. */
  itemLabel: string;
  count: number;
  onAdd: () => void;
  /** List-level error (e.g. "Add at least one pipe segment"), shown above the rows. */
  error?: string;
  /**
   * Tight spacing for lists of one-line rows (a branch's sprinklers, the riser): the rows sit close
   * together instead of being cards of their own.
   */
  compact?: boolean;
  children: ReactNode;
}

/**
 * Header (count + Add) and error line shared by this feature's three editable row lists. Follows
 * PipeSegmentListInput's layout — same wording pattern, same button styling — so the sprinkler
 * network tables read like the pump TDH segment list rather than a new dialect.
 */
export function RowList({
  itemLabel,
  count,
  onAdd,
  error,
  compact = false,
  children,
}: RowListProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {count === 0 ? `No ${itemLabel}s` : `${count} ${itemLabel}${count === 1 ? "" : "s"}`}
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          + Add {itemLabel}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      {count > 0 && (
        <div className={`flex flex-col ${compact ? "gap-1.5" : "gap-4"}`}>{children}</div>
      )}
    </div>
  );
}

interface RowActionsProps {
  /** Used for the icon buttons' accessible names, e.g. "sprinkler 2". */
  describedAs: string;
  onDuplicate: () => void;
  onRemove: () => void;
  /** Blocks removing the last row of a list the API requires to be non-empty. */
  removeDisabled?: boolean;
}

/** The duplicate and remove icon buttons every row of this feature carries. */
export function RowActions({
  describedAs,
  onDuplicate,
  onRemove,
  removeDisabled = false,
}: RowActionsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onDuplicate}
        aria-label={`Duplicate ${describedAs}`}
        title={`Duplicate ${describedAs}`}
        className="rounded-md border border-zinc-300 p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
          <path
            d="M7 7V4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5v7A1.5 1.5 0 0 1 15.5 13H13M4.5 7h7A1.5 1.5 0 0 1 13 8.5v7A1.5 1.5 0 0 1 11.5 17h-7A1.5 1.5 0 0 1 3 15.5v-7A1.5 1.5 0 0 1 4.5 7Z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={removeDisabled}
        aria-label={`Remove ${describedAs}`}
        title={removeDisabled ? "At least one is required" : `Remove ${describedAs}`}
        className="rounded-md border border-zinc-300 p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
          <path
            d="M5 5l10 10M15 5L5 15"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

interface RowCardProps extends RowActionsProps {
  title: string;
  children: ReactNode;
}

/** One row of a RowList: a bordered card with duplicate and remove actions. */
export function RowCard({
  title,
  describedAs,
  onDuplicate,
  onRemove,
  removeDisabled = false,
  children,
}: RowCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</span>
        <RowActions
          describedAs={describedAs}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          removeDisabled={removeDisabled}
        />
      </div>
      {children}
    </div>
  );
}
