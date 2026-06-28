"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { ExplainableChatPanel } from "@/components/ExplainableChatPanel";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/locales";
import { defaultPriorityWeights } from "@/lib/priority-scoring";
import type { SiteDashboardItem } from "@/lib/site-view-model";

type DetailChatLauncherProps = {
  selectedSiteId: string;
  rankedSites: SiteDashboardItem[];
  locale: Locale;
};

export function DetailChatLauncher({
  selectedSiteId,
  rankedSites,
  locale,
}: DetailChatLauncherProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const copy = getDashboardCopy(locale);
  const selectedSite = useMemo(
    () =>
      rankedSites.find((site) => site.site_id === selectedSiteId) ??
      rankedSites[0] ??
      null,
    [rankedSites, selectedSiteId],
  );

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[1000] sm:bottom-6 sm:right-6">
        <button
          type="button"
          className="chat-launcher group relative grid size-14 place-items-center rounded-full text-white"
          onClick={() => setChatOpen((open) => !open)}
          aria-label={chatOpen ? copy.closeChat : copy.openChat}
        >
          <img className="chat-launcher-logo" src="/brand/chaka-tree.png" alt="" aria-hidden="true" />
          {!chatOpen && (
            <span className="floating-control absolute right-16 top-2 hidden whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-fg after:absolute after:-right-1 after:top-1/2 after:size-2 after:-translate-y-1/2 after:rotate-45 after:border-r after:border-t after:border-[var(--chaka-line)] after:bg-[var(--chaka-paper)] sm:block">
              {copy.askMe}
            </span>
          )}
        </button>
      </div>

      {chatOpen && (
        <aside className="chat-panel fixed bottom-4 right-4 top-24 z-[999] w-[min(430px,calc(100vw-2rem))] overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="eyebrow">{copy.chatTitle}</p>
              <p className="text-sm text-muted">{copy.chatSubtitle}</p>
            </div>
            <button
              type="button"
              className="panel-action grid size-9 place-items-center rounded-full"
              onClick={() => setChatOpen(false)}
              aria-label={copy.closeChat}
            >
              <X aria-hidden="true" size={17} strokeWidth={2.4} />
            </button>
          </div>
          <ExplainableChatPanel
            selectedSite={selectedSite}
            rankedSites={rankedSites}
            weights={defaultPriorityWeights}
            locale={locale}
            embedded
          />
        </aside>
      )}
    </>
  );
}
