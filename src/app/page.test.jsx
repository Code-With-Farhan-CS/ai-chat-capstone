import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useChat } from "@ai-sdk/react";
import ChatPage from "./page";

// We never want these tests to hit the real /api/chat route or the
// real Anthropic API. Mocking the `useChat` hook (rather than fetch)
// means the component tests exercise ChatPage's own rendering logic
// in complete isolation from network/streaming concerns, which is
// exactly what "unit" tests should do here — the Playwright test
// covers the real streaming pipeline end to end.
vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(),
}));

// A default chat state that individual tests override just the
// fields they care about. Keeps each test focused on one behavior.
function makeChatState(overrides = {}) {
  return {
    messages: [],
    sendMessage: vi.fn(),
    status: "ready",
    stop: vi.fn(),
    error: undefined,
    regenerate: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  useChat.mockReturnValue(makeChatState());
});

describe("ChatPage — empty state", () => {
  it("shows example prompts when there are no messages", () => {
    render(<ChatPage />);

    expect(
      screen.getByText(/no messages yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /what can you help me with/i })
    ).toBeInTheDocument();
  });

  it("fills the input when an example prompt is clicked", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.click(
      screen.getByRole("button", { name: /what can you help me with/i })
    );

    expect(screen.getByRole("textbox", { name: /chat message/i })).toHaveValue(
      "What can you help me with?"
    );
  });
});

describe("ChatPage — rendering messages", () => {
  it("renders text parts for both user and assistant messages", () => {
    useChat.mockReturnValue(
      makeChatState({
        messages: [
          { id: "1", role: "user", parts: [{ type: "text", text: "Hi there" }] },
          {
            id: "2",
            role: "assistant",
            parts: [{ type: "text", text: "Hello! How can I help?" }],
          },
        ],
      })
    );

    render(<ChatPage />);

    const log = screen.getByRole("log", { name: /chat messages/i });
    expect(within(log).getByText("Hi there")).toBeInTheDocument();
    expect(
      within(log).getByText("Hello! How can I help?")
    ).toBeInTheDocument();
  });

  it("ignores non-text part types instead of crashing", () => {
    useChat.mockReturnValue(
      makeChatState({
        messages: [
          {
            id: "1",
            role: "assistant",
            parts: [
              { type: "tool-call", toolName: "lookup", input: {} },
              { type: "text", text: "Here is the answer" },
            ],
          },
        ],
      })
    );

    render(<ChatPage />);

    expect(screen.getByText("Here is the answer")).toBeInTheDocument();
    // The unhandled part type should not render any stray text.
    expect(screen.queryByText(/lookup/i)).not.toBeInTheDocument();
  });
});

describe("ChatPage — sending a message (form)", () => {
  it("disables the Send button while the input is empty or whitespace", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: /chat message/i }), "   ");
    expect(sendButton).toBeDisabled();
  });

  it("calls sendMessage with the typed text and clears the input on submit", async () => {
    const user = userEvent.setup();
    const state = makeChatState();
    useChat.mockReturnValue(state);
    render(<ChatPage />);

    const input = screen.getByRole("textbox", { name: /chat message/i });
    await user.type(input, "What's the weather?");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(state.sendMessage).toHaveBeenCalledWith({
      text: "What's the weather?",
    });
    expect(input).toHaveValue("");
  });
});

describe("ChatPage — pending (submitted) state", () => {
  it("shows a thinking indicator and disables the input while waiting for a reply", () => {
    useChat.mockReturnValue(makeChatState({ status: "submitted" }));
    render(<ChatPage />);

    expect(
      screen.getByRole("status", { name: /assistant is thinking/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /chat message/i })).toBeDisabled();
  });
});

describe("ChatPage — streaming state", () => {
  it("shows a Stop button instead of Send, and calls stop() when clicked", async () => {
    const user = userEvent.setup();
    const state = makeChatState({ status: "streaming" });
    useChat.mockReturnValue(state);
    render(<ChatPage />);

    expect(screen.queryByRole("button", { name: /^send$/i })).not.toBeInTheDocument();
    const stopButton = screen.getByRole("button", { name: /stop/i });

    await user.click(stopButton);
    expect(state.stop).toHaveBeenCalledOnce();
  });
});

describe("ChatPage — error state", () => {
  it("shows the error message and retries the failed exchange on click", async () => {
    const user = userEvent.setup();
    const state = makeChatState({
      status: "error",
      error: { message: "The AI service is temporarily overloaded." },
    });
    useChat.mockReturnValue(state);
    render(<ChatPage />);

    const alert = screen.getByRole("alert");
    expect(
      within(alert).getByText(/temporarily overloaded/i)
    ).toBeInTheDocument();

    await user.click(within(alert).getByRole("button", { name: /retry/i }));
    expect(state.regenerate).toHaveBeenCalledOnce();
  });

  it("falls back to a generic message when the error has none", () => {
    useChat.mockReturnValue(makeChatState({ status: "error", error: undefined }));
    render(<ChatPage />);

    expect(
      screen.getByText(/something went wrong\. please try again\./i)
    ).toBeInTheDocument();
  });
});
