import { EXPLAINABLE_CHAT_SYSTEM_PROMPT } from "@/chatbot/prompts/systemPrompt";
import type { ExplainableChatRequest } from "@/chatbot/types";

export function buildServerMessages({ message, context }: ExplainableChatRequest) {
  return [
    {
      role: "system",
      content: EXPLAINABLE_CHAT_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: [
        "User question:",
        message,
        "",
        "Recommendation context JSON:",
        JSON.stringify(context, null, 2),
        "",
        "Answer using only this context. Include a short 'Used fields' note at the end.",
      ].join("\n"),
    },
  ];
}
