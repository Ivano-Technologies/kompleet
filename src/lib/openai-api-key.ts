/**
 * Server-only OpenAI key. Never read NEXT_PUBLIC_* — that name would be
 * inlined into the browser bundle if it were ever set.
 */
export function serverOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || undefined;
}
