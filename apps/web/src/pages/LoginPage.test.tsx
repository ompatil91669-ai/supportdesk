import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";

vi.mock("../lib/auth-context", () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

afterEach(() => cleanup());

describe("Login Page", () => {
  it("shows validation errors when email and password are empty", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("Email is required.")
    ).toBeTruthy();

    expect(
      screen.getByText("Password is required.")
    ).toBeTruthy();
  });

  it("shows an error for invalid email", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(
      screen.getByLabelText("Email address"),
      "invalid-email"
    );

    await user.type(
      screen.getByLabelText("Password"),
      "password123"
    );

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeTruthy();
  });
});
