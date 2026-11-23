import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TicketCreatePage from "./TicketCreatePage";

const {
  mockUseAuth,
  mockUseCreateTicket,
  mockCreateTicket,
  mockCreateTicketComment,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseCreateTicket: vi.fn(),
  mockCreateTicket: vi.fn(),
  mockCreateTicketComment: vi.fn(),
}));

vi.mock("../lib/auth-context", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../features/tickets/hooks/useTickets", () => ({
  useCreateTicket: mockUseCreateTicket,
}));

vi.mock("../features/tickets/api/tickets", () => ({
  createTicketComment: mockCreateTicketComment,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function setupCreatePage() {
  mockUseAuth.mockReturnValue({
    user: {
      id: "customer-1",
      name: "Customer One",
      email: "customer@example.test",
      role: "Customer",
    },
  });
  mockUseCreateTicket.mockReturnValue({
    mutateAsync: mockCreateTicket,
    isPending: false,
  });
  mockCreateTicket.mockImplementation(async (input) => ({
    ...input,
    status: "Open",
    userId: "customer-1",
    assigneeId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }));
  mockCreateTicketComment.mockResolvedValue({});
}

function renderCreatePage() {
  return render(
    <MemoryRouter initialEntries={["/tickets/new"]}>
      <Routes>
        <Route path="/tickets/new" element={<TicketCreatePage />} />
        <Route path="/tickets/:id" element={<p>Ticket details page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Ticket creation page", () => {
  it("creates an owned ticket with an initial public issue comment", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("crypto", { randomUUID: () => "test-ticket-uuid" });
    setupCreatePage();
    renderCreatePage();

    await user.selectOptions(screen.getByLabelText("Priority"), "High");
    await user.type(
      screen.getByLabelText("Describe your issue"),
      "I cannot access my account."
    );
    await user.click(screen.getByRole("button", { name: "Create Ticket" }));

    expect(await screen.findByText("Ticket details page")).toBeTruthy();
    expect(mockCreateTicket).toHaveBeenCalledWith({
      id: "TKT-test-ticket-uuid",
      name: "Customer One",
      email: "customer@example.test",
      priority: "High",
    });
    expect(mockCreateTicketComment).toHaveBeenCalledWith(
      "TKT-test-ticket-uuid",
      { content: "I cannot access my account." }
    );
  });

  it("links to the created ticket if saving its initial comment fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("crypto", { randomUUID: () => "test-ticket-uuid" });
    setupCreatePage();
    mockCreateTicketComment.mockRejectedValue(new Error("Server unavailable"));
    renderCreatePage();

    await user.type(
      screen.getByLabelText("Describe your issue"),
      "I need assistance."
    );
    await user.click(screen.getByRole("button", { name: "Create Ticket" }));

    expect(
      await screen.findByText(
        /Ticket TKT-test-ticket-uuid was created, but your message could not be saved/
      )
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Open created ticket" }).getAttribute("href")
    ).toBe("/tickets/TKT-test-ticket-uuid");
    expect(screen.getByRole("button", { name: "Ticket created" }).hasAttribute("disabled"))
      .toBe(true);
  });
});
