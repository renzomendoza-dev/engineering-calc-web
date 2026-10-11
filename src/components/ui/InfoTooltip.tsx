"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface InfoTooltipProps {
  text: string;
}

/**
 * A small "ⓘ" trigger next to a label that reveals `text` on hover or click/tap — for
 * guidance that's useful but too long to keep permanently visible under every field (see
 * NumberField's `hint` for the always-visible alternative). Click/tap support (not just
 * hover) is what keeps this reachable without a mouse.
 */
export function InfoTooltip({ text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  /**
   * Centres the box on the "ⓘ", and keeps it on screen when the trigger sits near an edge.
   *
   * A trigger within half the box's width of the edge used to hang off the page: on a phone, the
   * tooltip on a long label put the whole page into horizontal scrolling. The position is set as
   * a pixel `left` rather than a centring transform, for two reasons. A transform would compose
   * with Tailwind's `-translate-x-1/2` (which compiles to the standalone `translate` property,
   * not `transform`) and centre the box twice; and Chrome counts an absolutely positioned
   * element's pre-transform box in the page's scrollable area, so a transform-shifted tooltip
   * still left a sliver of horizontal scroll even while looking correctly placed.
   *
   * Measured from the trigger, never from the tooltip's current position, so running again can't
   * compound. Written straight to the node: it's a measurement correcting the DOM, not state a
   * render needs. useLayoutEffect, so it lands before paint and the box is never seen misplaced.
   */
  useLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    if (!open || !tooltip || !container) return;

    const margin = 8;
    const viewportWidth = document.documentElement.clientWidth;
    const trigger = container.getBoundingClientRect();
    const width = tooltip.offsetWidth;

    const centred = trigger.left + trigger.width / 2 - width / 2;
    const clamped = Math.min(Math.max(centred, margin), Math.max(margin, viewportWidth - margin - width));
    tooltip.style.left = `${clamped - trigger.left}px`;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <span ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="More information"
        aria-expanded={open}
        className="flex h-4 w-4 items-center justify-center rounded-full text-xs leading-none text-zinc-400 outline-none transition-colors hover:text-zinc-600 focus-visible:ring-1 focus-visible:ring-blue-500 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        ⓘ
      </button>
      {open && (
        <span
          ref={tooltipRef}
          role="tooltip"
          // left is set by the layout effect above, before paint; left-0 is only the starting point.
          className="absolute bottom-full left-0 z-10 mb-2 w-64 max-w-[calc(100vw-1rem)] rounded-md border border-zinc-200 bg-white p-2 text-xs font-normal text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {text}
        </span>
      )}
    </span>
  );
}
