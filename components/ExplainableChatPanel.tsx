"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { getChatCopy } from "@/lib/i18n/ui-copy";
import type { SiteDashboardItem } from "@/lib/site-view-model";
import type { PriorityWeights } from "@/lib/priority-scoring";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ExplainableChatPanelProps = {
  selectedSite: SiteDashboardItem | null;
  rankedSites: SiteDashboardItem[];
  weights: PriorityWeights;
  locale: Locale;
  embedded?: boolean;
};

export function ExplainableChatPanel({
  selectedSite,
  rankedSites,
  weights,
  locale,
  embedded = false,
}: ExplainableChatPanelProps) {
  const copy = getChatCopy(locale);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function sendMessage(messageOverride?: string) {
    const content = (messageOverride ?? draft).trim();
    if (!content || !selectedSite || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/explainable-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          site_id: selectedSite.site_id,
          locale,
          weights,
          ranked_site_ids: rankedSites.slice(0, 8).map((site) => site.site_id),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || copy.requestError);
      }

      const payload = (await response.json()) as { answer: string; model_used: string };
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.answer,
        },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.sendError);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className={embedded ? "grid gap-4" : "rounded-[18px] border border-[var(--chaka-line)] bg-white/80 p-4 shadow-[var(--chaka-shadow-soft)]"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold">{copy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {copy.description}
          </p>
        </div>
        <span className="rounded-full border border-[var(--chaka-line)] bg-white/70 px-2.5 py-1 text-xs font-medium text-muted">
          {copy.sourceBadge}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--chaka-line-strong)] bg-[#f7faf4] p-3 text-sm leading-6 text-muted">
            {copy.emptyState}
          </div>
        ) : (
          <div className="grid max-h-80 gap-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-md border p-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "border-[var(--chaka-line)] bg-white text-fg"
                    : "border-[var(--chaka-line-strong)] bg-[#eef7f2] text-muted"
                }`}
              >
                <p className="mb-1 text-xs font-semibold uppercase text-accent">
                  {message.role === "user" ? copy.userLabel : copy.assistantLabel}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {copy.suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => sendMessage(question)}
              className="rounded-full border border-[var(--chaka-line)] bg-white/70 px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-[var(--chaka-line-strong)] hover:bg-white"
              disabled={!selectedSite || isSending}
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-4 grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
      >
        <label className="text-sm font-semibold" htmlFor="explainable-chat-message">
          {copy.inputLabel}
        </label>
        <textarea
          id="explainable-chat-message"
          className="min-h-24 resize-y rounded-xl border border-[var(--chaka-line)] bg-white/80 px-3 py-2 text-sm leading-6 text-fg outline-none transition placeholder:text-muted/70 focus:border-[var(--chaka-line-strong)] focus:bg-white"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={copy.placeholder(selectedSite?.site_id)}
        />
        {error && (
          <p className="rounded-xl border border-[#e7b9aa] bg-[#fff2ec] px-3 py-2 text-sm text-[#8c2f1b]">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(31,111,104,0.22)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!selectedSite || isSending || draft.trim().length === 0}
        >
          {isSending ? copy.sending : copy.submit}
        </button>
      </form>
    </section>
  );
}
