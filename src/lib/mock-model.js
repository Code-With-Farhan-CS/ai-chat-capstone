// src/lib/mock-model.js
//
// A fake "language model" that streamText() can use exactly like the
// real Anthropic model, but without making any network calls or
// costing anything. Useful when API credits aren't available yet —
// it exercises the full streaming + error-handling pipeline for real.
//
// Swap back to the real model at any time by removing MOCK_MODE from
// .env.local — no other code changes needed.

import { MockLanguageModelV4, simulateReadableStream } from "ai/test";

// A small pool of varied canned replies so repeated testing doesn't
// feel identical every time. Picked randomly per request.
const MOCK_REPLIES = [
  "I'm currently running in mock mode, so this isn't a real AI response — but the streaming, error handling, and retry behavior you're seeing are all real and fully functional.",
  "This is a simulated response used to test the chat interface without calling the live API. Once a funded API key is added, real Claude responses will stream in exactly like this.",
  "Here's a mock reply streaming in word by word, just like a real model response would. It's here so the interface, skeletons, and scroll behavior can be tested end to end.",
  "Mock mode is active. This message is generated locally to simulate a normal, successful response — useful for demoing the happy path without needing API credits.",
];

function pickReply() {
  return MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
}

// Builds a fresh mock model per request so each call gets its own
// randomly chosen reply and its own independent stream.
export function createMockModel() {
  const words = pickReply().split(" ");

  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        initialDelayInMs: 500,
        chunkDelayInMs: 35,
        chunks: [
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "mock-1" },
          ...words.map((word, i) => ({
            type: "text-delta",
            id: "mock-1",
            delta: i === 0 ? word : " " + word,
          })),
          { type: "text-end", id: "mock-1" },
          {
            type: "finish",
            finishReason: "stop",
            usage: { inputTokens: 20, outputTokens: words.length },
          },
        ],
      }),
    }),
  });
}