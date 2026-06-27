"use client";

import { useState } from "react";
import type { ChatMessage, ExplainableChatContext } from "@/chatbot/types";

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useExplainableChat(context: ExplainableChatContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(messageOverride?: string) {
    const message = (messageOverride ?? draft).trim();
    if (!message || isStreaming) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: message,
    };
    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content: "",
    };

    setDraft("");
    setError(null);
    setIsStreaming(true);
    setMessages((current) => [...current, userMessage, assistantMessage]);

    try {
      const response = await fetch("/api/explainable-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(errorText || "Chat request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessage.id ? { ...item, content: item.content + chunk } : item,
          ),
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to explain this recommendation.");
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessage.id && !item.content
            ? {
                ...item,
                content:
                  "I could not generate an explanation. Check that the chatbot feature flag and server API key are configured.",
              }
            : item,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return {
    draft,
    error,
    isStreaming,
    messages,
    sendMessage,
    setDraft,
  };
}
