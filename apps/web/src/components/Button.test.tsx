import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button";

afterEach(cleanup);

describe("Button", () => {
  it.each(["primary", "secondary", "outline", "danger"] as const)(
    "supports the %s variant",
    (variant) => {
      render(<Button variant={variant}>Action</Button>);

      expect(screen.getByRole("button", { name: "Action" }).className)
        .toContain(`button-${variant}`);
    }
  );

  it.each(["small", "medium", "large"] as const)(
    "supports the %s size",
    (size) => {
      render(<Button size={size}>Action</Button>);

      expect(screen.getByRole("button", { name: "Action" }).className)
        .toContain(`button-${size}`);
    }
  );

  it("preserves native button props and calls its handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button variant="outline" size="large" onClick={onClick} type="button">
        Continue
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Continue" }).className)
      .toContain("button-outline");
    expect(screen.getByRole("button", { name: "Continue" }).className)
      .toContain("button-large");
  });

  it("disables while loading and exposes its busy state", () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole("button", { name: "Saving" });

    expect(button).toHaveProperty("disabled", true);
    expect(button.getAttribute("aria-busy")).toBe("true");
  });

  it("preserves an explicitly disabled state", () => {
    render(<Button disabled>Unavailable</Button>);

    expect(screen.getByRole("button", { name: "Unavailable" }))
      .toHaveProperty("disabled", true);
  });
});
