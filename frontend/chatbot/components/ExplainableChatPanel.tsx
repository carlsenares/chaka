"use client";

import { useMemo } from "react";
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
  const { draft, error, isStreaming, messages, sendMessage, setDraft } = useExplainableChat(context);
  const starterCopy = useMemo(
    () =>
      `Ask about ${context.selectedRankedArea.name}, score drivers, methodology, limitations, or comparisons with lower-ranked areas.`,
    [context.selectedRankedArea.name],
  );

  return (
    <section className="rounded-lg border border-[#d8e5dc] bg-[#f8fbf7] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-fg">Explain this recommendation</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{starterCopy}</p>
        </div>
        <span className="rounded-full border border-[#c8dacd] bg-white px-2.5 py-1 text-xs font-semibold text-[#1f6f68]">
          Grounded
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        {messages.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#c8dacd] bg-white p-3 text-sm leading-6 text-muted">
            Responses are grounded in the selected ranked area, ranked candidates, backend sample outputs,
            and methodology notes.
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
                  {message.role === "user" ? "Question" : "Explanation"}
                </p>
                <p className="whitespace-pre-wrap">{message.content || "Preparing explanation..."}</p>
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
              className="rounded-full border border-[#c8dacd] bg-white px-3 py-1.5 text-xs font-semibold text-fg transition hover:bg-[#eef7f2]"
              disabled={isStreaming}
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
        <label className="text-sm font-semibold text-fg" htmlFor="explainable-chat-message">
          Ask a question
        </label>
        <textarea
          id="explainable-chat-message"
          className="min-h-24 resize-y rounded-md border border-[#d9d0bd] bg-white px-3 py-2 text-sm leading-6 text-fg outline-none transition focus:border-[#1f6f68] focus:ring-2 focus:ring-[#1f6f68]/20"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Why did this area receive this score?"
        />
        {error && <p className="rounded-md bg-[#fff2ec] px-3 py-2 text-sm text-[#8c2f1b]">{error}</p>}
        <button
          type="submit"
          className="rounded-full bg-[#1f6f68] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#185b55] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isStreaming || draft.trim().length === 0}
        >
          {isStreaming ? "Explaining..." : "Explain"}
        </button>
      </form>
    </section>
  );
}
