// src/lib/ai-config.js
//
// Central place for anything related to which model we call and how
// we instruct it. Keeping this separate from the route handler means
// FE-07 (tool calling) can extend this file without touching the
// streaming logic itself.

// The Claude model this app uses for chat responses.
// Using Sonnet as a balance of quality and speed for a chat interface.
export const CHAT_MODEL = "claude-sonnet-5";

// The system prompt sets the assistant's persona and behavior for
// every conversation. Edit this to match your capstone's actual use
// case (e.g. a qualification chatbot, an audit summarizer, etc).
export const SYSTEM_PROMPT = `You are a helpful AI assistant embedded in a
web app. Keep responses concise and conversational, formatted in plain
text or simple markdown (short paragraphs, occasional lists). Avoid
overly long responses unless the user explicitly asks for detail.`;

// Generation settings. Kept here so they're easy to tune in one place
// rather than scattered across the route handler.
export const GENERATION_CONFIG = {
  maxOutputTokens: 1024,
};
