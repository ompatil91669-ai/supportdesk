import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage";

const { mockLogin } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
}));

vi.mock("../lib/auth-context", () => ({
  useAuth: () => ({
    user: null,
    login: mockLogin,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>Dashboard home</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Login Page", () => {
  it("detects the account workspace automatically instead of asking for a role", () => {
    renderLoginPage();

    expect(screen.getByText("Automatic account routing")).toBeTruthy();
    expect(screen.getByText("Your saved account role decides which workspace opens."))
      .toBeTruthy();
    expect(screen.queryByRole("button", { name: /customer sign-in/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /agent sign-in/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeTruthy();
  });

  it("shows validation errors when email and password are empty", async () => {
    const user = userEvent.setup();

    renderLoginPage();

    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(
      await screen.findByText("Email is required.")
    ).toBeTruthy();

    expect(
      screen.getByText("Password is required.")
    ).toBeTruthy();
  });

  it("shows an error for invalid email", async () => {
    const user = userEvent.setup();

    renderLoginPage();

    await user.type(
      screen.getByLabelText("Email address"),
      "invalid-email"
    );

    await user.type(
      screen.getByLabelText("Password"),
      "password123"
    );

    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeTruthy();
  });

  it("signs in using the credentials and routes based on the authenticated account", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();

    await user.type(screen.getByLabelText("Email address"), " AGENT@example.test ");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Dashboard home")).toBeTruthy();
    expect(mockLogin).toHaveBeenCalledWith("agent@example.test", "password123");
  });
});
