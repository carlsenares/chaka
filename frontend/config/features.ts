function isEnabled(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes((value ?? "").toLowerCase());
}

export const FEATURES = {
  explainableChat: isEnabled(process.env.NEXT_PUBLIC_ENABLE_CHATBOT ?? process.env.ENABLE_CHATBOT),
} as const;
