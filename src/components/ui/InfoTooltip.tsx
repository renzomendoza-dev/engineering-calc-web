"use client";

import { useEffect, useRef, useState } from "react";

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
          role="tooltip"
          className="absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-md border border-zinc-200 bg-white p-2 text-xs font-normal text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {text}
        </span>
      )}
    </span>
  );
}
