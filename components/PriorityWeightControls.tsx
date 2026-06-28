"use client";

import {
  priorityObjectives,
  type PriorityWeights,
} from "@/lib/priority-scoring";

type PriorityWeightControlsProps = {
  weights: PriorityWeights;
  onChange: (key: keyof PriorityWeights, value: number) => void;
  onReset: () => void;
  compact?: boolean;
};

export function PriorityWeightControls({
  weights,
  onChange,
  onReset,
  compact = false,
}: PriorityWeightControlsProps) {
  return (
    <section className={compact ? "grid gap-4" : "rounded-lg border border-[#d9d0bd] bg-surface p-4 shadow-sm"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={compact ? "text-base font-semibold" : "text-lg font-semibold"}>Priority weights</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Recomputes the ranking from the canonical feature payload.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-[#cfc2aa] px-3 py-2 text-sm font-medium text-fg transition hover:border-accent"
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      <div className={compact ? "grid gap-4 lg:max-h-[calc(100vh-17rem)] lg:overflow-y-auto lg:pr-1" : "mt-5 grid gap-4"}>
        {priorityObjectives.map((objective) => (
          <label key={objective.key} className="grid gap-2">
            <span className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold">{objective.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {objective.description}
                </span>
              </span>
              <output className="min-w-10 rounded-md bg-accent/15 px-2 py-1 text-center text-sm font-semibold text-accent">
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
