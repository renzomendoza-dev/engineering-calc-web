import { FormulaBlock } from "@/components/ui/FormulaBlock";

export function DistanceAttenuationFormula() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      <FormulaBlock
        label="Inverse-Square Law (Distance Attenuation)"
        tex="SPL_2 = SPL_1 - 20 \log_{10}\left(\dfrac{d_2}{d_1}\right)"
        highlighted
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        SPL_1 = reference sound pressure level (dB), d_1 = reference distance (m), d_2 = target
        distance (m), SPL_2 = sound pressure level at the target distance (dB).
      </p>
    </div>
  );
}
