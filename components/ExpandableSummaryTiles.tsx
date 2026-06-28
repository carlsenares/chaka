"use client";

import { useState } from "react";

export type SummaryTileItem = {
  label: string;
  value: string;
};

type ExpandableSummaryTilesProps = {
  items: SummaryTileItem[];
};

export function ExpandableSummaryTiles({ items }: ExpandableSummaryTilesProps) {
  const [expanded, setExpanded] = useState<SummaryTileItem | null>(null);

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className="min-h-32 rounded-md border border-[#e7deca] bg-[#fbf7ee] p-3 text-left transition hover:border-[#1f6f68] hover:bg-[#f1f7f2] focus:outline-none focus:ring-2 focus:ring-[#1f6f68]/30"
            onClick={() => setExpanded(item)}
          >
            <p className="text-xs font-semibold uppercase text-accent">{item.label}</p>
            <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted">{item.value}</p>
          </button>
        ))}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-[1200] grid place-items-center bg-[#1d241f]/35 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setExpanded(null)}
        >
          <button
            type="button"
            className="w-full max-w-2xl rounded-lg border border-[#d9d0bd] bg-surface p-6 text-left shadow-2xl shadow-black/25 transition-transform duration-200 ease-out"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded(null);
            }}
            aria-label={`Close ${expanded.label}`}
          >
            <p className="text-sm font-semibold uppercase text-accent">{expanded.label}</p>
            <p className="mt-4 text-lg leading-8 text-fg">{expanded.value}</p>
            <p className="mt-5 text-sm font-semibold text-accent">Click to close</p>
          </button>
        </div>
      )}
    </>
  );
}
