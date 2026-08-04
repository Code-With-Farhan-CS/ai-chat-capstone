"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";

const EXAMPLE_PROMPTS = [
  "What can you help me with?",
  "Summarize the plot of a sci-fi movie in 3 sentences",
  "Give me 3 ideas for a weekend project",
];

export default function ChatPage() {
  const { messages, sendMessage, status, stop, error, regenerate } =
    useChat();
  const [input, setInput] = useState("");
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const scrollContainerRef = useRef(null);

 const isThinking = status === "submitted";
  const isStreaming = status === "streaming";
  const isBusy = isThinking || isStreaming;
  const hasError = status === "error";

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsPinnedToBottom(distanceFromBottom < 80);
  }

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el && isPinnedToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isPinnedToBottom]);

  // Reset the retry lock once we leave the error state, so the
  // button is fresh next time something fails.
  useEffect(() => {
    if (!hasError) setIsRetrying(false);
  }, [hasError]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    setIsPinnedToBottom(true);
    sendMessage({ text: input });
    setInput("");
  }

  function handleExampleClick(text) {
    setInput(text);
  }

  // Retries only the failed exchange (regenerate re-runs the last
  // user message against the model) — it does not resend the whole
  // conversation. Guarded against double-clicks with isRetrying.
  function handleRetry() {
    if (isRetrying) return;
    setIsRetrying(true);
    setIsPinnedToBottom(true);
    regenerate();
  }

  function jumpToLatest() {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setIsPinnedToBottom(true);
  }

  const isEmpty = messages.length === 0 && !isBusy;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-4 w-full">
      <h1 className="text-2xl font-bold py-4 shrink-0">Chat</h1>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
          className="h-full overflow-y-auto overscroll-contain space-y-3 pb-4"
        >
          {isEmpty && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
              <p className="text-zinc-400">
                No messages yet — try asking something.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleExampleClick(prompt)}
                    className="text-sm text-left rounded-xl border border-gray-700 px-4 py-2 hover:bg-gray-800 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <span key={i}>{part.text}</span>
                  ) : null
                )}
              </div>
            </div>
          ))}

          {/* Skeleton, sized to match a real bubble, avoids layout
              shift when the first token arrives. */}
          {isThinking && (
            <div className="flex justify-start">
              <div
                role="status"
                aria-label="Assistant is thinking"
                className="max-w-[80%] w-40 rounded-2xl px-4 py-3 bg-gray-800 animate-pulse"
              >
                <div className="h-3 w-3/4 rounded bg-gray-700 mb-2" />
                <div className="h-3 w-1/2 rounded bg-gray-700" />
              </div>
            </div>
          )}

          {hasError && (
            <div className="flex justify-start">
              <div
                role="alert"
                className="max-w-[80%] rounded-2xl px-4 py-3 bg-red-950 text-red-300 text-sm flex flex-col gap-2"
              >
                <span>
                  {error?.message || "Something went wrong. Please try again."}
                </span>
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="self-start rounded-full bg-red-800 px-3 py-1 text-xs font-medium text-red-50 disabled:opacity-50"
                >
                  {isRetrying ? "Retrying…" : "Retry"}
                </button>
              </div>
            </div>
          )}
        </div>

        {!isPinnedToBottom && (
          <button
            onClick={jumpToLatest}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-sm px-3 py-1 rounded-full shadow"
          >
            ↓ Jump to latest
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 py-3 border-t border-gray-800 shrink-0"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          aria-label="Chat message"
          disabled={isBusy}
          className="flex-1 border border-gray-700 bg-transparent rounded-full px-4 py-2 text-base disabled:opacity-50"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={stop}
            className="bg-red-600 text-white px-4 py-2 rounded-full"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || isBusy}
            className="bg-blue-600 text-white px-4 py-2 rounded-full disabled:opacity-50"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}