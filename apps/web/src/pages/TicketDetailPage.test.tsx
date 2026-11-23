import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TicketDetailPage from "./TicketDetailPage";

const {
  mockUseAuth,
  mockUseTicket,
  mockUseTicketComments,
  mockUseChangeTicketStatus,
  mockUseAssignableAgents,
  mockUseAssignTicket,
  mockUseAddTicketComment,
  mockChangeStatus,
  mockAssignTicket,
  mockAddComment,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseTicket: vi.fn(),
  mockUseTicketComments: vi.fn(),
  mockUseChangeTicketStatus: vi.fn(),
  mockUseAssignableAgents: vi.fn(),
  mockUseAssignTicket: vi.fn(),
  mockUseAddTicketComment: vi.fn(),
  mockChangeStatus: vi.fn(),
  mockAssignTicket: vi.fn(),
  mockAddComment: vi.fn(),
}));

vi.mock("../lib/auth-context", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../features/tickets/hooks/useTickets", () => ({
  useTicket: mockUseTicket,
  useTicketComments: mockUseTicketComments,
  useChangeTicketStatus: mockUseChangeTicketStatus,
  useAssignableAgents: mockUseAssignableAgents,
  useAssignTicket: mockUseAssignTicket,
  useAddTicketComment: mockUseAddTicketComment,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ticket = {
  id: "TKT-101",
  name: "Customer One",
  email: "customer@example.test",
  status: "Open" as const,
  priority: "High" as const,
  userId: "customer-1",
  assigneeId: "agent-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderTicketDetail() {
  return render(
    <MemoryRouter initialEntries={["/tickets/TKT-101"]}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function setupTicketPage(role: "Agent" | "Customer" | "Admin") {
  mockUseAuth.mockReturnValue({
    user: {
      id:
        role === "Agent"
          ? "agent-1"
          : role === "Admin"
            ? "admin-1"
            : "customer-1",
      name: role,
      email: `${role.toLowerCase()}@example.test`,
      role,
    },
  });
  mockUseTicket.mockReturnValue({
    data: ticket,
    isLoading: false,
    isError: false,
  });
  mockUseTicketComments.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  });
  mockUseChangeTicketStatus.mockReturnValue({
    mutate: mockChangeStatus,
    isPending: false,
    isError: false,
  });
  mockUseAssignableAgents.mockReturnValue({
    data: [
      { id: "agent-1", name: "Agent One", email: "one@example.test" },
      { id: "agent-2", name: "Agent Two", email: "two@example.test" },
    ],
    isLoading: false,
    isError: false,
  });
  mockUseAssignTicket.mockReturnValue({
    mutate: mockAssignTicket,
    isPending: false,
    isError: false,
  });
  mockUseAddTicketComment.mockReturnValue({
    mutate: mockAddComment,
    isPending: false,
    isError: false,
  });
}

describe("Ticket detail page", () => {
  it("lets agents change status and add an internal note", async () => {
    const user = userEvent.setup();
    setupTicketPage("Agent");
    renderTicketDetail();

    await user.selectOptions(screen.getByLabelText("Change ticket status"), "Pending");
    await user.click(screen.getByRole("button", { name: "Update status" }));
    expect(mockChangeStatus).toHaveBeenCalledWith(
      "Pending",
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );

    await user.type(screen.getByLabelText("Add a comment"), "Investigating");
    await user.click(
      screen.getByLabelText("Internal note (visible to agents and admins)")
    );
    await user.click(screen.getByRole("button", { name: "Send comment" }));
    expect(mockAddComment).toHaveBeenCalledWith(
      { content: "Investigating", isInternal: true },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("lets customers comment but hides agent-only controls", async () => {
    const user = userEvent.setup();
    setupTicketPage("Customer");
    renderTicketDetail();

    expect(screen.queryByLabelText("Change ticket status")).toBeNull();
    expect(
      screen.queryByLabelText("Internal note (visible to agents and admins)")
    ).toBeNull();

    await user.type(screen.getByLabelText("Add a comment"), "I need help");
    await user.click(screen.getByRole("button", { name: "Send comment" }));
    expect(mockAddComment).toHaveBeenCalledWith(
      { content: "I need help", isInternal: false },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("lets admins assign tickets to agents", async () => {
    const user = userEvent.setup();
    setupTicketPage("Admin");
    renderTicketDetail();

    await user.selectOptions(
      screen.getByLabelText("Assign ticket to agent"),
      "agent-2"
    );
    await user.click(screen.getByRole("button", { name: "Save assignment" }));

    expect(mockAssignTicket).toHaveBeenCalledWith(
      "agent-2",
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});
