"use client";

import {
  priorityObjectives,
  type PriorityWeights,
} from "@/lib/priority-scoring";
import { getWeightControlsCopy } from "@/lib/i18n/ui-copy";
import type { Locale } from "@/lib/i18n/locales";

type PriorityWeightControlsProps = {
  weights: PriorityWeights;
  onChange: (key: keyof PriorityWeights, value: number) => void;
  onReset: () => void;
  locale: Locale;
  compact?: boolean;
};

export function PriorityWeightControls({
  weights,
  onChange,
  onReset,
  locale,
  compact = false,
}: PriorityWeightControlsProps) {
  const copy = getWeightControlsCopy(locale);

  return (
    <section className={compact ? "grid gap-4" : "rounded-[18px] border border-[var(--chaka-line)] bg-white/80 p-4 shadow-[var(--chaka-shadow-soft)]"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={compact ? "text-base font-semibold" : "text-lg font-semibold"}>{copy.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            {copy.description}
          </p>
        </div>
        <button
          type="button"
          className="panel-action rounded-full px-3 py-2 text-sm font-semibold"
          onClick={onReset}
        >
          {copy.reset}
        </button>
      </div>

      <div className={compact ? "grid gap-4 lg:max-h-[calc(100vh-17rem)] lg:overflow-y-auto lg:pr-1" : "mt-5 grid gap-4"}>
        {priorityObjectives.map((objective) => (
          <label key={objective.key} className="grid gap-2 rounded-xl border border-[var(--chaka-line)] bg-white/70 p-3">
            <span className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold">{copy.objectives[objective.key].label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {copy.objectives[objective.key].description}
                </span>
              </span>
              <output className="min-w-11 rounded-full bg-accent/10 px-2.5 py-1 text-center text-sm font-semibold tabular-nums text-accent">
                {weights[objective.key]}
              </output>
            </span>
            <input
              className="priority-slider"
              type="range"
              min="0"
              max="100"
              value={weights[objective.key]}
              onChange={(event) => onChange(objective.key, Number(event.target.value))}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
