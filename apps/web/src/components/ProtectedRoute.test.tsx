import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock("../lib/auth-context", () => ({
  useAuth: mockUseAuth,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Protected Route", () => {
  it("redirects unauthenticated users to login", () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<h1>Login Page</h1>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<h1>Dashboard Page</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page")).toBeTruthy();
    expect(screen.queryByText("Dashboard Page")).toBeNull();
  });

  it("allows authenticated users to access dashboard", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "1",
        name: "Test User",
        email: "testuser@example.com",
        role: "Customer",
      },
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<h1>Login Page</h1>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<h1>Dashboard Page</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard Page")).toBeTruthy();
    expect(screen.queryByText("Login Page")).toBeNull();
  });
});
