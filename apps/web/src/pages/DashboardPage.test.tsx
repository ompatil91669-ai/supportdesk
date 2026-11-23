import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "./DashboardPage";

const { mockUseAuth, mockUseTickets } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseTickets: vi.fn(),
}));

vi.mock("../lib/auth-context", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../features/tickets/hooks/useTickets", () => ({
  useTickets: mockUseTickets,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ticket = (id: string, name: string) => ({
  id,
  name,
  email: `${id.toLowerCase()}@example.test`,
  status: "Open" as const,
  priority: "Medium" as const,
  userId: "customer-1",
  assigneeId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe("Dashboard ticket list", () => {
  it("shows all-ticket totals and recent tickets for an Agent", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "agent-1",
        name: "Support Agent",
        email: "agent@example.test",
        role: "Agent",
      },
      logout: vi.fn(),
    });
    mockUseTickets.mockReturnValue({
      data: {
        data: [ticket("TKT-101", "Customer One"), ticket("TKT-102", "Customer Two")],
        meta: { page: 1, limit: 5, total: 50, totalPages: 10 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();

    expect(screen.getByRole("heading", { name: "All Tickets" })).toBeTruthy();
    expect(screen.getByLabelText("Ticket count").textContent).toBe("50 tickets");
    expect(screen.queryByRole("link", { name: "Create Ticket" })).toBeNull();
    expect(screen.getByText("TKT-101")).toBeTruthy();
    expect(screen.getByRole("link", { name: "TKT-101" }).getAttribute("href"))
      .toBe("/tickets/TKT-101");
    expect(screen.getByText("TKT-102")).toBeTruthy();
    expect(mockUseTickets).toHaveBeenCalledWith({ limit: 5 });
  });

  it("shows only the current customer's tickets returned by the API", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "customer-1",
        name: "Customer One",
        email: "customer@example.test",
        role: "Customer",
      },
      logout: vi.fn(),
    });
    mockUseTickets.mockReturnValue({
      data: {
        data: [ticket("TKT-OWNED", "My ticket")],
        meta: { page: 1, limit: 5, total: 1, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();

    expect(screen.getByRole("heading", { name: "Your Tickets" })).toBeTruthy();
    expect(screen.getByLabelText("Ticket count").textContent).toBe("1 ticket");
    expect(screen.getByRole("link", { name: "Create Ticket" }).getAttribute("href"))
      .toBe("/tickets/new");
    expect(screen.getByText("TKT-OWNED")).toBeTruthy();
    expect(screen.queryByText("TKT-OTHER")).toBeNull();
    expect(mockUseTickets).toHaveBeenCalledWith({ limit: 5 });
  });
});
