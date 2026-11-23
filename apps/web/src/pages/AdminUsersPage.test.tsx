import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AdminUsersPage from "./AdminUsersPage";

const {
  mockUseAuth,
  mockUseManagedUsers,
  mockUseCreateManagedUser,
  mockUseUpdateManagedUser,
  mockUseDeleteManagedUser,
  mockCreateUser,
  mockUpdateUser,
  mockDeleteUser,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseManagedUsers: vi.fn(),
  mockUseCreateManagedUser: vi.fn(),
  mockUseUpdateManagedUser: vi.fn(),
  mockUseDeleteManagedUser: vi.fn(),
  mockCreateUser: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockDeleteUser: vi.fn(),
}));

vi.mock("../lib/auth-context", () => ({ useAuth: mockUseAuth }));
vi.mock("../features/users/hooks/useManagedUsers", () => ({
  useManagedUsers: mockUseManagedUsers,
  useCreateManagedUser: mockUseCreateManagedUser,
  useUpdateManagedUser: mockUseUpdateManagedUser,
  useDeleteManagedUser: mockUseDeleteManagedUser,
}));

const nativeShowModal = HTMLDialogElement.prototype.showModal;
const nativeClose = HTMLDialogElement.prototype.close;

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(() => {
  cleanup();
  if (nativeShowModal) {
    HTMLDialogElement.prototype.showModal = nativeShowModal;
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  }
  if (nativeClose) {
    HTMLDialogElement.prototype.close = nativeClose;
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  }
  vi.clearAllMocks();
});

const users = [
  {
    id: "customer-1",
    name: "Jamie Customer",
    email: "jamie@example.test",
    role: "Customer" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "agent-1",
    name: "Alex Agent",
    email: "alex@example.test",
    role: "Agent" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "admin-1",
    name: "Taylor Admin",
    email: "taylor@example.test",
    role: "Admin" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

function setupAdminPage() {
  mockUseAuth.mockReturnValue({ user: users[2] });
  mockUseManagedUsers.mockReturnValue({
    data: users,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
  mockUseCreateManagedUser.mockReturnValue({
    mutateAsync: mockCreateUser,
    isPending: false,
  });
  mockUseUpdateManagedUser.mockReturnValue({
    mutateAsync: mockUpdateUser,
    isPending: false,
  });
  mockUseDeleteManagedUser.mockReturnValue({
    mutateAsync: mockDeleteUser,
    isPending: false,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminUsersPage />
    </MemoryRouter>
  );
}

describe("Admin user management", () => {
  it("shows all roles and filters the directory", async () => {
    const user = userEvent.setup();
    setupAdminPage();
    renderPage();

    expect(screen.getByText("Jamie Customer")).toBeTruthy();
    expect(screen.getByText("Alex Agent")).toBeTruthy();
    expect(screen.getByText("Taylor Admin")).toBeTruthy();

    await user.selectOptions(screen.getByLabelText("Filter by role"), "Agent");
    expect(screen.getByText("Alex Agent")).toBeTruthy();
    expect(screen.queryByText("Jamie Customer")).toBeNull();
  });

  it("creates an account with an Admin-selected role", async () => {
    const user = userEvent.setup();
    setupAdminPage();
    mockCreateUser.mockResolvedValue(users[1]);
    renderPage();

    const addUserButton = screen.getByRole("button", { name: /add user/i });
    await user.click(addUserButton);
    const nameInput = screen.getByLabelText("Full name");
    expect(document.activeElement).toBe(nameInput);
    await user.type(nameInput, "Morgan New");
    await user.type(screen.getByLabelText("Email address"), "morgan@example.test");
    await user.type(screen.getByLabelText("Temporary password"), "password-123");
    await user.selectOptions(screen.getByLabelText("Role"), "Admin");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(mockCreateUser).toHaveBeenCalledWith({
      name: "Morgan New",
      email: "morgan@example.test",
      password: "password-123",
      role: "Admin",
    });
    expect(document.activeElement).toBe(addUserButton);
  });

  it("confirms before deleting an account and explains history retention", async () => {
    const user = userEvent.setup();
    setupAdminPage();
    mockDeleteUser.mockResolvedValue({ id: "customer-1" });
    renderPage();

    await user.click(screen.getByRole("button", { name: "Delete Jamie Customer" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.textContent).toContain("comments are kept");
    expect(dialog).toHaveProperty("open", true);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Cancel" })
    );
    await user.click(screen.getByRole("button", { name: "Delete account" }));

    expect(mockDeleteUser).toHaveBeenCalledWith("customer-1");
  });
});
