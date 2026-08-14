"use client";

import { useState } from "react";
import { ConversionSheet } from "./ConversionSheet";

export function ConversionFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open unit converter"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6" aria-hidden="true">
          <path
            d="M4 6h9m0 0l-3-3m3 3l-3 3M16 14H7m0 0l3-3m-3 3l3 3"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <ConversionSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
