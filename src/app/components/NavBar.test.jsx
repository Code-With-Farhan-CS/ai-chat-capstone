import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("NavBar", () => {
  it("renders a link for every section", () => {
    usePathname.mockReturnValue("/");
    render(<NavBar />);

    for (const name of ["Chat", "History", "Settings", "Health"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("marks the link matching the current route as the current page", () => {
    usePathname.mockReturnValue("/settings");
    render(<NavBar />);

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("does not mark other links as the current page", () => {
    usePathname.mockReturnValue("/settings");
    render(<NavBar />);

    expect(
      screen.getByRole("link", { name: "Chat" })
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("link", { name: "History" })
    ).not.toHaveAttribute("aria-current");
  });
});
