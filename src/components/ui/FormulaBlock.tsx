import katex from "katex";

interface FormulaBlockProps {
  label: string;
  tex: string;
  description?: string;
  highlighted?: boolean;
}

/**
 * Renders a labeled LaTeX formula with KaTeX. Generic across calculators — any feature
 * that needs to show a reference formula should reuse this rather than rendering KaTeX
 * directly.
 */
export function FormulaBlock({ label, tex, description, highlighted = false }: FormulaBlockProps) {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: true,
  });

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        highlighted
          ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
      <div
        className="mt-2 overflow-x-auto text-zinc-900 dark:text-zinc-50"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {description && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
    </div>
  );
}
