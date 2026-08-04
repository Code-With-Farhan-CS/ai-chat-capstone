// src/app/api/chat/route.js
//
// Server-side route handler for the streaming chat interface.
// This is the only place the Anthropic API key is used — it never
// reaches the browser.

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages } from "ai";
import { CHAT_MODEL, SYSTEM_PROMPT, GENERATION_CONFIG, MOCK_MODE } from "@/lib/ai-config";
import { createMockModel } from "@/lib/mock-model";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Turns any thrown error into a short, user-safe message.
// Never leak raw error.message from the SDK — it can contain
// internal details we don't want in the UI.
function friendlyErrorMessage(error) {
  const status = error?.statusCode || error?.status || error?.cause?.status;

  if (status === 429) {
    return "We're getting a lot of requests right now. Please wait a moment and try again.";
  }
  if (status === 529 || status === 503) {
    return "The AI service is temporarily overloaded. Please try again in a few seconds.";
  }
  if (status === 401 || status === 403) {
    return "There's a configuration issue with the AI service right now.";
  }
  if (status >= 400 && status < 500) {
    return "That request couldn't be processed. Please try again.";
  }
  return "Something went wrong while generating a response. Please try again.";
}

export async function POST(req) {
  let messages;

  // 1. Malformed request body (e.g. network cut mid-send, bad JSON)
  try {
    const body = await req.json();
    messages = body?.messages;
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  // 2. Empty / missing messages (first-run misuse, dropped state)
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("No messages provided.", { status: 400 });
  }

  // --- TEST HOOK: lets you deterministically trigger failure states
  // for the checkpoint recording without editing this file each time.
  // Trigger by sending a message that starts with "/simulate-".
  // Remove or comment this block out before final submission if you want.
  const lastText = messages[messages.length - 1]?.parts?.find(
    (p) => p.type === "text"
  )?.text;

  if (lastText === "/simulate-429") {
    return new Response(friendlyErrorMessage({ statusCode: 429 }), { status: 429 });
  }
  if (lastText === "/simulate-500") {
    return new Response(friendlyErrorMessage({ statusCode: 500 }), { status: 500 });
  }
  // --- end test hook

  try {
    const model = MOCK_MODE ? createMockModel() : anthropic(CHAT_MODEL);

    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: GENERATION_CONFIG.maxOutputTokens,
      onError: ({ error }) => {
        // Server-side log only — never sent to the client verbatim.
        console.error("streamText error:", error);
      },
    });

    // onError here maps any mid-stream failure (dropped connection,
    // model overload, malformed tool output) into the string that
    // ends up in useChat's `error.message` on the client.
    return result.toUIMessageStreamResponse({
      onError: (error) => friendlyErrorMessage(error),
    });
  } catch (error) {
    console.error("Chat route error:", error);
    const status = error?.statusCode || error?.status || 500;
    return new Response(friendlyErrorMessage(error), { status });
  }
}