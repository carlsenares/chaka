"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ExplainableChatPanel } from "@/components/ExplainableChatPanel";
import type { PriorityWeights } from "@/lib/priority-scoring";
import type { SiteDashboardItem } from "@/lib/site-view-model";

type FloatingExplainableChatProps = {
  selectedSite: SiteDashboardItem | null;
  rankedSites: SiteDashboardItem[];
  weights: PriorityWeights;
  leadingControl?: ReactNode;
  panelSubtitle?: string;
};

export function FloatingExplainableChat({
  selectedSite,
  rankedSites,
  weights,
  leadingControl,
  panelSubtitle = "Grounded in the selected area.",
}: FloatingExplainableChatProps) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <div className="fixed right-4 top-4 z-[1000] flex items-start gap-24">
        {leadingControl}
        <button
          type="button"
          className="group relative grid size-14 place-items-center rounded-full border border-[#cfc2aa] bg-[#1f6f68] text-white shadow-lg shadow-black/15 transition hover:bg-[#185c56] focus:outline-none focus:ring-2 focus:ring-[#1f6f68]/35"
          onClick={() => setChatOpen((open) => !open)}
          aria-label={chatOpen ? "Close Chaka chat" : "Open Chaka chat"}
          aria-expanded={chatOpen}
        >
          <MessageCircle className="size-6" aria-hidden="true" strokeWidth={2.2} />
          {!chatOpen && (
            <span className="absolute right-16 top-2 whitespace-nowrap rounded-2xl border border-[#d9d0bd] bg-surface px-3 py-1.5 text-xs font-semibold text-fg shadow-sm after:absolute after:-right-1 after:top-1/2 after:size-2 after:-translate-y-1/2 after:rotate-45 after:border-r after:border-t after:border-[#d9d0bd] after:bg-surface">
              Ask me
            </span>
          )}
        </button>
      </div>

      {chatOpen && (
        <aside className="fixed bottom-4 right-4 top-24 z-[999] w-[min(420px,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-[#d9d0bd] bg-surface p-4 shadow-2xl shadow-black/20">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-accent">Chaka assistant</p>
              <p className="text-sm text-muted">{panelSubtitle}</p>
            </div>
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-[#cfc2aa] bg-[#fbf7ee] text-muted transition hover:bg-[#eef7f2] focus:outline-none focus:ring-2 focus:ring-[#1f6f68]/30"
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <ExplainableChatPanel
            selectedSite={selectedSite}
            rankedSites={rankedSites}
            weights={weights}
            embedded
          />
        </aside>
      )}
    </>
  );
}
