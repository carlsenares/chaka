import type { ObjectiveKey, ObjectiveWeights } from "@/data/atlasViewModel";
import { objectives } from "@/data/prioritizationConfig";

export function PriorityWeightSliders({
  objectiveWeights,
  onWeightChange,
}: {
  objectiveWeights: ObjectiveWeights;
  onWeightChange: (key: ObjectiveKey, value: number) => void;
}) {
  return (
    <div className="grid gap-6">
      {objectives.map((objective) => (
        <ObjectiveSlider
          key={objective.key}
          objective={objective}
          value={objectiveWeights[objective.key]}
          onChange={(value) => onWeightChange(objective.key, value)}
        />
      ))}
    </div>
  );
}

export function PriorityWeightsSummary({ objectiveWeights }: { objectiveWeights: ObjectiveWeights }) {
  return (
    <div className="rounded-lg border border-[#dfe7dc] bg-[#f8faf7] p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-fg">Current Priority Weights</h3>
          <p className="text-sm text-muted">Active objective preferences used for this ranking.</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        {objectives.map((objective) => (
          <div
            key={objective.key}
            className="flex items-center justify-between gap-3 rounded-md border border-[#dfe7dc] bg-white px-3 py-2"
          >
            <dt className="text-sm text-muted">{objective.label}</dt>
            <dd className="text-sm font-semibold text-fg">{objectiveWeights[objective.key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ObjectiveSlider({
  objective,
  value,
  onChange,
}: {
  objective: (typeof objectives)[number];
  value: number;
  onChange: (value: number) => void;
}) {
  const inputId = `objective-${objective.key}`;

  return (
    <div className="rounded-md border border-[#dfe7dc] bg-white p-4 transition hover:border-[#bfd3c6]">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <label htmlFor={inputId} className="font-semibold text-fg">
            {objective.label}
          </label>
          <p className="mt-1 text-sm leading-6 text-muted">{objective.description}</p>
        </div>
        <output
          htmlFor={inputId}
          className="min-w-14 rounded-full bg-[#edf5ee] px-3 py-1 text-center text-sm font-semibold text-[#236b44]"
        >
          {value}
        </output>
      </div>
      <input
        id={inputId}
        className="objective-slider"
        type="range"
        min="0"
        max="100"
        value={value}
        aria-label={`${objective.label} weight`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}
