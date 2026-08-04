import { test, expect } from "@playwright/test";

// Walks the primary flow a real user takes: land on the chat page,
// send a message, watch it stream in, and see it persist in the
// message log. Runs against the app's own MOCK_MODE (see
// src/lib/mock-model.js) so this exercises the real streaming +
// rendering pipeline without ever calling the live Anthropic API.
test("user can send a message and see a streamed reply", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Chat" })).toBeVisible();
  await expect(page.getByText(/no messages yet/i)).toBeVisible();

  const input = page.getByRole("textbox", { name: /chat message/i });
  await input.fill("What can you help me with?");
  await page.getByRole("button", { name: /^send$/i }).click();

  const log = page.getByRole("log", { name: /chat messages/i });

  // The user's own message appears immediately.
  await expect(log.getByText("What can you help me with?")).toBeVisible();

  // While waiting for the model, a thinking indicator shows up...
  await expect(page.getByRole("status", { name: /assistant is thinking/i })).toBeVisible();

  // ...and is replaced by a streamed assistant reply once mock-model
  // finishes streaming. All four canned replies mention "mock", so we
  // assert on that rather than an exact string.
  await expect(page.getByText(/mock/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("status", { name: /assistant is thinking/i })).toHaveCount(0);

  // The input is free to use again and the conversation persisted.
  await expect(input).toBeEnabled();
  await expect(log.getByText("What can you help me with?")).toBeVisible();
});
