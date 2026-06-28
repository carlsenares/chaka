import { FEATURES } from "@/config/features";
import { buildServerMessages } from "@/chatbot/lib/buildServerMessages";
import type { ExplainableChatRequest } from "@/chatbot/types";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const OUT_OF_DOMAIN_RESPONSE =
  "I'm designed specifically to explain the restoration prioritization results and the underlying methodology for this application. I can't answer questions outside that scope.";

export async function POST(request: Request) {
  if (!FEATURES.explainableChat) {
    return new Response("Explainable chatbot is disabled.", { status: 404 });
  }

  const body = (await request.json()) as Partial<ExplainableChatRequest>;

  if (!body.message || !body.context) {
    return new Response("Missing message or context.", { status: 400 });
  }

  if (!isInDomainQuestion(body.message)) {
    return new Response(OUT_OF_DOMAIN_RESPONSE, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response("OPENAI_API_KEY is not configured.", { status: 503 });
  }

  const upstream = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      stream: true,
      temperature: 0.2,
      messages: buildServerMessages({ message: body.message, context: body.context }),
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text();
    return new Response(errorText || "Chat completion request failed.", { status: upstream.status || 502 });
  }

  return new Response(streamChatCompletionsText(upstream.body), {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function isInDomainQuestion(message: string) {
  const normalized = message.toLowerCase();
  const domainTerms = [
    "area",
    "assumption",
    "biodiversity",
    "backend",
    "carbon",
    "candidate",
    "confidence",
    "contributed",
    "data",
    "evidence",
    "ethiopia",
    "higher",
    "highest",
    "indicator",
    "intervention",
    "livelihood",
    "limitation",
    "lower",
    "method",
    "pcod",
    "priority",
    "prioritization",
    "rank",
    "recommendation",
    "restoration",
    "score",
    "soil",
    "source",
    "trade-off",
    "tradeoff",
    "water",
    "weight",
  ];
  const explicitOutOfDomainTerms = [
    "code",
    "debug",
    "javascript",
    "legal",
    "medical",
    "movie",
    "politics",
    "program",
    "recipe",
    "song",
    "sports",
    "stock",
    "weather",
  ];

  if (domainTerms.some((term) => normalized.includes(term))) return true;
  if (["why", "why?", "explain", "how so?"].includes(normalized.trim())) return true;

  return false;
}

function streamChatCompletionsText(body: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader();

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const payload = trimmed.replace(/^data:\s*/, "");
            if (payload === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
            } catch {
              // Ignore malformed stream fragments and continue reading.
            }
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}
