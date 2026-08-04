import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Ensure each test starts with a clean DOM so assertions like
// getByRole don't accidentally match leftovers from a previous test.
afterEach(() => {
  cleanup();
});
