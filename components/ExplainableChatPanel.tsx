"use client";

import { useState } from "react";
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
  embedded?: boolean;
};

const suggestedQuestions = [
  "Why is this area ranked this way?",
  "What local evidence matters most?",
  "What should an NGO verify before investing?",
];

export function ExplainableChatPanel({
  selectedSite,
  rankedSites,
  weights,
  embedded = false,
}: ExplainableChatPanelProps) {
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
          weights,
          ranked_site_ids: rankedSites.slice(0, 8).map((site) => site.site_id),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Explanation request failed.");
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
      setError(requestError instanceof Error ? requestError.message : "Explanation failed.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className={embedded ? "grid gap-4" : "rounded-lg border border-[#d9d0bd] bg-surface p-4 shadow-sm"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-accent">Grounded chat</p>
          <h2 className="mt-1 text-lg font-semibold">Explain this recommendation</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Ask about score drivers, local evidence, caveats, field checks, or comparisons.
          </p>
        </div>
        <span className="rounded-full border border-[#cfc2aa] px-2.5 py-1 text-xs text-muted">
          OpenAI
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {messages.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#cfc2aa] bg-[#fbf7ee] p-3 text-sm leading-6 text-muted">
            The assistant receives the selected site, current ranking context, local evidence
            cards, and source-grounding rules. It should not invent data or change scores.
          </div>
        ) : (
          <div className="grid max-h-80 gap-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-md border p-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "border-[#cfc2aa] bg-[#fbf7ee] text-fg"
                    : "border-[#d9d0bd] bg-[#eef7f2] text-muted"
                }`}
              >
                <p className="mb-1 text-xs font-semibold uppercase text-accent">
                  {message.role === "user" ? "Question" : "Answer"}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => sendMessage(question)}
              className="rounded-full border border-[#cfc2aa] px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-[#fbf7ee]"
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
          Ask a question
        </label>
        <textarea
          id="explainable-chat-message"
          className="min-h-24 resize-y rounded-md border border-[#d9d0bd] bg-[#fbf7ee] px-3 py-2 text-sm leading-6 text-fg outline-none transition placeholder:text-muted/70 focus:border-accent"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={selectedSite ? `Ask about ${selectedSite.site_id}` : "Select a site first"}
        />
        {error && (
          <p className="rounded-md border border-[#e7b9aa] bg-[#fff2ec] px-3 py-2 text-sm text-[#8c2f1b]">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!selectedSite || isSending || draft.trim().length === 0}
        >
          {isSending ? "Explaining..." : "Explain"}
        </button>
      </form>
    </section>
  );
}
