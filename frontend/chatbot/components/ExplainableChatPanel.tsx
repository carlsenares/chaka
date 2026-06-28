"use client";

import { useMemo, useState } from "react";
import type { ChatArea, ChatPriorityResult, ExplainableChatContext } from "@/chatbot/types";
import { buildExplainableChatContext } from "@/chatbot/lib/buildChatPayload";
import { useExplainableChat } from "@/chatbot/hooks/useExplainableChat";

type ExplainableChatPanelProps = {
  selectedRankedArea: ChatArea;
  rankedCandidateAreas: ChatArea[];
  priorityResults: ChatPriorityResult[];
  dataSourceMode: ExplainableChatContext["dataSourceMode"];
  objectiveWeights: ExplainableChatContext["objectiveWeights"];
  backendSampleOutput: ExplainableChatContext["backendSampleOutput"];
};

const suggestedQuestions = [
  "Why is this area ranked highest?",
  "Which indicators contributed most?",
  "What trade-offs should we consider?",
] as const;

export function ExplainableChatPanel({
  selectedRankedArea,
  rankedCandidateAreas,
  priorityResults,
  dataSourceMode,
  objectiveWeights,
  backendSampleOutput,
}: ExplainableChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const context = useMemo(
    () =>
      buildExplainableChatContext({
        selectedRankedArea,
        rankedCandidateAreas,
        priorityResults,
        dataSourceMode,
        objectiveWeights,
        backendSampleOutput,
      }),
    [backendSampleOutput, dataSourceMode, objectiveWeights, priorityResults, rankedCandidateAreas, selectedRankedArea],
  );
  const { draft, error, isStreaming, messages, resetChat, sendMessage, setDraft } = useExplainableChat(context);
  const starterCopy = useMemo(
    () =>
      `Ask about ${context.selectedRankedArea.name}, score drivers, methodology, limitations, or comparisons with lower-ranked areas.`,
    [context.selectedRankedArea.name],
  );

  return (
    <>
      {isOpen && (
        <section className="fixed bottom-24 right-5 z-[900] max-h-[calc(100vh-8rem)] w-[calc(100vw-2.5rem)] max-w-md overflow-y-auto rounded-lg border border-[#dfe7dc] bg-white p-4 shadow-[0_6px_18px_rgb(34_54_42_/_0.12)] sm:right-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-accent">Chaka · AI Q&A assistant</p>
              <h3 className="mt-1 text-lg font-semibold text-fg">Explain this recommendation</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{starterCopy}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetChat();
                setIsOpen(false);
              }}
              className="rounded-full border border-[#dfe7dc] bg-white px-2.5 py-1 text-xs font-semibold text-muted transition hover:bg-[#edf5ee]"
              aria-label="Close Chaka AI assistant"
            >
              Close
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#dfe7dc] bg-white px-2.5 py-1 text-xs font-semibold text-[#236b44]">
              Grounded in ranking data
            </span>
            <span className="rounded-full border border-[#dfe7dc] bg-[#f8faf7] px-2.5 py-1 text-xs font-semibold text-muted">
              Q&A for restoration decisions
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {messages.length === 0 ? (
              <div className="rounded-md border border-dashed border-[#c8d6ca] bg-[#f8faf7] p-3 text-sm leading-6 text-muted">
                Chaka answers questions about the selected recommendation using ranked areas, backend sample outputs,
                active weights, and methodology notes.
              </div>
            ) : (
              <div className="grid max-h-80 gap-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`rounded-md border p-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "border-[#dfe7dc] bg-white text-fg"
                        : "border-[#d9e4d8] bg-[#f2f7f1] text-muted"
                    }`}
                  >
                    <p className="mb-1 text-xs font-semibold text-accent">
                      {message.role === "user" ? "Question" : "Chaka"}
                    </p>
                    <p className="whitespace-pre-wrap">{message.content || "Preparing explanation..."}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => sendMessage(question)}
                className="rounded-full border border-[#dfe7dc] bg-white px-3 py-1.5 text-xs font-semibold text-fg transition hover:bg-[#edf5ee] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isStreaming}
              >
                {question}
              </button>
            ))}
          </div>

          <form
            className="mt-4 grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <label className="text-sm font-semibold text-fg" htmlFor="explainable-chat-message">
              Ask Chaka
            </label>
            <textarea
              id="explainable-chat-message"
              className="min-h-24 resize-y rounded-md border border-[#dfe7dc] bg-white px-3 py-2 text-sm leading-6 text-fg outline-none transition focus:border-[#236b44] focus:ring-2 focus:ring-[#236b44]/20"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask why this area ranked highly..."
            />
            {error && <p className="rounded-md bg-[#fff2ec] px-3 py-2 text-sm text-[#8c2f1b]">{error}</p>}
            <button
              type="submit"
              className="rounded-full bg-[#236b44] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d5838] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isStreaming || draft.trim().length === 0}
            >
              {isStreaming ? "Chaka is answering..." : "Ask Chaka"}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            resetChat();
            setIsOpen(false);
            return;
          }

          setIsOpen(true);
        }}
        className="fixed bottom-5 right-5 z-[901] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-full border border-[#236b44] bg-[#236b44] px-4 py-3 text-left text-white shadow-[0_4px_12px_rgb(34_54_42_/_0.18)] transition hover:bg-[#1d5838] focus:outline-none focus:ring-2 focus:ring-[#236b44] focus:ring-offset-2 focus:ring-offset-base sm:right-8"
        aria-expanded={isOpen}
        aria-label="Open Chaka AI Q&A assistant"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#236b44]">
          AI
        </span>
        <span className="grid leading-tight">
          <span className="text-sm font-semibold">Chaka</span>
          <span className="text-xs text-white/82">AI assistant for Q&A</span>
        </span>
      </button>
    </>
  );
}
