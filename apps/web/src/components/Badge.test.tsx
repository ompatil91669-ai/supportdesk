import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Badge from "./Badge";

describe("Badge", () => {
  it("renders the provided status text with its variant", () => {
    render(<Badge variant="pending">Pending</Badge>);
    const badge = screen.getByText("Pending");

    expect(badge.tagName).toBe("SPAN");
    expect(badge.className).toContain("badge-pending");
  });
});
