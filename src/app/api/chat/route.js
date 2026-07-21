// src/app/api/chat/route.js
//
// Server-side route handler for the streaming chat interface.
// This is the only place the Anthropic API key is used — it never
// reaches the browser.

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages } from "ai";
import { CHAT_MODEL, SYSTEM_PROMPT, GENERATION_CONFIG } from "@/lib/ai-config";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic(CHAT_MODEL),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: GENERATION_CONFIG.maxOutputTokens,
  });

  return result.toUIMessageStreamResponse();
}