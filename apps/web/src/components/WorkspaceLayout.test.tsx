import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import WorkspaceLayout from "./WorkspaceLayout";

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock("../lib/auth-context", () => ({ useAuth: mockUseAuth }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderWorkspace(role: "Admin" | "Agent" | "Customer") {
  mockUseAuth.mockReturnValue({
    user: { name: "Taylor", role },
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route element={<WorkspaceLayout />}>
          <Route path="/dashboard" element={<h1>Overview page</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("Workspace navigation", () => {
  it("shows user management in the Admin sidebar", () => {
    renderWorkspace("Admin");

    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "User management" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tickets" })).toBeTruthy();
  });

  it("keeps the Admin-only link out of Customer and Agent sidebars", () => {
    const { rerender } = renderWorkspace("Customer");

    expect(screen.queryByRole("link", { name: "User management" })).toBeNull();
    expect(screen.getByRole("link", { name: "New ticket" })).toBeTruthy();

    mockUseAuth.mockReturnValue({
      user: { name: "Alex", role: "Agent" },
      logout: vi.fn(),
    });
    rerender(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<WorkspaceLayout />}>
            <Route path="/dashboard" element={<h1>Overview page</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: "User management" })).toBeNull();
    expect(screen.queryByRole("link", { name: "New ticket" })).toBeNull();
  });
});
