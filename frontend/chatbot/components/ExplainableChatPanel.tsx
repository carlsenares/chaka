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
        <section className="fixed bottom-24 right-5 z-[900] max-h-[calc(100vh-8rem)] w-[calc(100vw-2.5rem)] max-w-md overflow-y-auto rounded-lg border border-[#c8dacd] bg-[#f8fbf7] p-4 shadow-lg sm:right-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-accent">Chaka · AI Q&A assistant</p>
              <h3 className="mt-1 text-lg font-semibold text-fg">Explain this recommendation</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{starterCopy}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetChat();
                setIsOpen(false);
              }}
              className="rounded-full border border-[#c8dacd] bg-white px-2.5 py-1 text-xs font-semibold text-muted transition hover:bg-[#eef7f2]"
              aria-label="Close Chaka AI assistant"
            >
              Close
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#c8dacd] bg-white px-2.5 py-1 text-xs font-semibold text-[#1f6f68]">
              Grounded in ranking data
            </span>
            <span className="rounded-full border border-[#d9d0bd] bg-[#fff9ed] px-2.5 py-1 text-xs font-semibold text-muted">
              Q&A for restoration decisions
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {messages.length === 0 ? (
              <div className="rounded-md border border-dashed border-[#c8dacd] bg-white p-3 text-sm leading-6 text-muted">
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
                        ? "border-[#d9d0bd] bg-white text-fg"
                        : "border-[#d8e5dc] bg-[#eef7f2] text-muted"
                    }`}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase text-accent">
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
                className="rounded-full border border-[#c8dacd] bg-white px-3 py-1.5 text-xs font-semibold text-fg transition hover:bg-[#eef7f2] disabled:cursor-not-allowed disabled:opacity-50"
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
              className="min-h-24 resize-y rounded-md border border-[#d9d0bd] bg-white px-3 py-2 text-sm leading-6 text-fg outline-none transition focus:border-[#1f6f68] focus:ring-2 focus:ring-[#1f6f68]/20"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask why this area ranked highly..."
            />
            {error && <p className="rounded-md bg-[#fff2ec] px-3 py-2 text-sm text-[#8c2f1b]">{error}</p>}
            <button
              type="submit"
              className="rounded-full bg-[#1f6f68] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#185b55] disabled:cursor-not-allowed disabled:opacity-50"
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
        className="fixed bottom-5 right-5 z-[901] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-full border border-[#c8dacd] bg-[#1f6f68] px-4 py-3 text-left text-white shadow-lg transition hover:bg-[#185b55] focus:outline-none focus:ring-2 focus:ring-[#1f6f68] focus:ring-offset-2 focus:ring-offset-base sm:right-8"
        aria-expanded={isOpen}
        aria-label="Open Chaka AI Q&A assistant"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#1f6f68]">
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
