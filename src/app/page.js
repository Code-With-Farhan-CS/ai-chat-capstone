"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const { messages, sendMessage, status, stop, error } = useChat();
  const [input, setInput] = useState("");
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const scrollContainerRef = useRef(null);

  const isThinking = status === "submitted";
  const isStreaming = status === "streaming";
  const isBusy = isThinking || isStreaming;

  // Track whether the user is scrolled to the bottom, so we only
  // auto-scroll while they haven't intentionally scrolled up to read
  // earlier messages.
  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsPinnedToBottom(distanceFromBottom < 80);
  }

  // Auto-scroll to bottom on new content, but only if the user was
  // already pinned to the bottom.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el && isPinnedToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isPinnedToBottom]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    setIsPinnedToBottom(true);
    sendMessage({ text: input });
    setInput("");
  }

  function jumpToLatest() {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
    setIsPinnedToBottom(true);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto px-4">
      <h1 className="text-2xl font-bold py-4">Chat</h1>

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto space-y-3 pb-4"
        >
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

          {isThinking && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-800 text-gray-400 italic">
                Thinking…
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-red-950 text-red-300 text-sm">
                Something went wrong: {error?.message || "please try again."}
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
        className="flex gap-2 py-3 border-t border-gray-800"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
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