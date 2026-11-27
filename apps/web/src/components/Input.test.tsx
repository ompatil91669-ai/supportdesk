import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Input from "./Input";

describe("Input", () => {
  it("associates the label and validation message with the input", () => {
    render(<Input label="Email address" type="email" error="Enter a valid email." />);

    const input = screen.getByLabelText("Email address");
    const error = screen.getByRole("alert");

    expect(input.getAttribute("type")).toBe("email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(error.id);
  });

  it("preserves native attributes and refs", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input label="Name" required disabled ref={ref} />);

    expect(screen.getByLabelText("Name")).toHaveProperty("required", true);
    expect(ref.current).toBe(screen.getByLabelText("Name"));
  });
});
