import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { Navigate } from "react-router-dom";
import Badge from "../components/Badge";
import type { BadgeVariant } from "../components/Badge";
import Button from "../components/Button";
import Input from "../components/Input";
import Modal from "../components/Modal";
import Table, { type TableColumn } from "../components/Table";
import {
  useCreateManagedUser,
  useDeleteManagedUser,
  useManagedUsers,
  useUpdateManagedUser,
} from "../features/users/hooks/useManagedUsers";
import type { ManagedUser } from "../features/users/api/users";
import type { UserRole } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";

type ManagedUserForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const emptyForm: ManagedUserForm = {
  name: "",
  email: "",
  password: "",
  role: "Customer",
};

const roles: UserRole[] = ["Customer", "Agent", "Admin"];
const roleBadgeVariant: Record<UserRole, BadgeVariant> = {
  Customer: "customer",
  Agent: "agent",
  Admin: "admin",
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const usersQuery = useManagedUsers();
  const createUser = useCreateManagedUser();
  const updateUser = useUpdateManagedUser();
  const deleteUser = useDeleteManagedUser();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<ManagedUserForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const formTriggerRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const formWasOpenRef = useRef(false);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const directoryHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (formOpen) {
      nameInputRef.current?.focus();
    } else if (formWasOpenRef.current) {
      formTriggerRef.current?.focus();
    }
    formWasOpenRef.current = formOpen;
  }, [formOpen]);

  if (user?.role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const users = usersQuery.data ?? [];
  const filteredUsers = users.filter((managedUser) => {
    const matchesRole = roleFilter === "All" || managedUser.role === roleFilter;
    const searchTerm = search.trim().toLowerCase();
    const matchesSearch =
      !searchTerm ||
      managedUser.name.toLowerCase().includes(searchTerm) ||
      managedUser.email.toLowerCase().includes(searchTerm);

    return matchesRole && matchesSearch;
  });
  const customerCount = users.filter(({ role }) => role === "Customer").length;
  const agentCount = users.filter(({ role }) => role === "Agent").length;
  const adminCount = users.filter(({ role }) => role === "Admin").length;
  const isSaving = createUser.isPending || updateUser.isPending;

  function openCreateForm(event: MouseEvent<HTMLButtonElement>) {
    formTriggerRef.current = event.currentTarget;
    setEditingUser(null);
    setForm(emptyForm);
    setFormError("");
    setPageError("");
    setNotice("");
    setFormOpen(true);
  }

  function openEditForm(
    managedUser: ManagedUser,
    event: MouseEvent<HTMLButtonElement>
  ) {
    formTriggerRef.current = event.currentTarget;
    setEditingUser(managedUser);
    setForm({
      name: managedUser.name,
      email: managedUser.email,
      password: "",
      role: managedUser.role,
    });
    setFormError("");
    setPageError("");
    setNotice("");
    setFormOpen(true);
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setPageError("");
    setNotice("");

    try {
      if (editingUser) {
        await updateUser.mutateAsync({
          id: editingUser.id,
          input: { name: form.name, email: form.email, role: form.role },
        });
        setNotice(`${form.name}’s account was updated.`);
      } else {
        await createUser.mutateAsync(form);
        setNotice(`${form.name}’s account was created.`);
      }

      setFormOpen(false);
      setEditingUser(null);
      setForm(emptyForm);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to save this account."
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setPageError("");
    setNotice("");
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      setNotice(`${deleteTarget.name}’s account was deleted.`);
      setDeleteTarget(null);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Unable to delete this account."
      );
      setDeleteTarget(null);
    }
  }

  const userColumns: TableColumn<ManagedUser>[] = [
    {
      key: "user",
      header: "User",
      render: (managedUser) => (
        <div className="user-cell">
          <span className="avatar-token" aria-hidden="true">
            {managedUser.name.trim().charAt(0).toUpperCase()}
          </span>
          <span>
            <strong>{managedUser.name}</strong>
            <small>{managedUser.email}</small>
          </span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (managedUser) => (
        <Badge variant={roleBadgeVariant[managedUser.role]}>
          {managedUser.role}
        </Badge>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (managedUser) =>
        new Date(managedUser.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: <span className="visually-hidden">Actions</span>,
      className: "table-actions-cell",
      render: (managedUser) => (
        <div className="row-actions">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={(event) => openEditForm(managedUser, event)}
            disabled={managedUser.id === user.id}
            aria-label={`Edit ${managedUser.name}`}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            size="small"
            onClick={(event) => {
              deleteTriggerRef.current = event.currentTarget;
              setDeleteTarget(managedUser);
            }}
            disabled={managedUser.id === user.id}
            aria-label={`Delete ${managedUser.name}`}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <main className="page-main">
      <div className="page-stack">
        <section className="page-heading">
          <div>
            <p className="page-kicker">Administration</p>
            <h1>People &amp; access</h1>
            <p className="page-description">
              Create accounts, update access levels, and manage your support team.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreateForm}
          >
            <span aria-hidden="true">＋</span> Add user
          </Button>
        </section>

        <section className="stats-grid" aria-label="Account totals">
          <article className="stat-card">
            <span className="stat-icon stat-icon-customer" aria-hidden="true">C</span>
            <div><p>Customers</p><strong>{customerCount}</strong></div>
          </article>
          <article className="stat-card">
            <span className="stat-icon stat-icon-agent" aria-hidden="true">A</span>
            <div><p>Agents</p><strong>{agentCount}</strong></div>
          </article>
          <article className="stat-card">
            <span className="stat-icon stat-icon-admin" aria-hidden="true">+</span>
            <div><p>Admins</p><strong>{adminCount}</strong></div>
          </article>
        </section>

        {notice && <p className="notice notice-success" role="status">{notice}</p>}
        {pageError && <p className="notice notice-error" role="alert">{pageError}</p>}

        {formOpen && (
          <section className="surface-card user-form-card">
            <div className="section-heading">
              <div>
                <p className="page-kicker">{editingUser ? "Edit account" : "New account"}</p>
                <h2>{editingUser ? "Update user details" : "Create a user"}</h2>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="small"
                className="button-quiet"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
            </div>
            <form className="user-form" onSubmit={submitUser}>
              <Input
                label="Full name"
                ref={nameInputRef}
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
              {!editingUser && (
                <Input
                  label="Temporary password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
              )}
              <label className="field">
                <span>Role</span>
                <select
                  value={form.role}
                  disabled={editingUser?.id === user.id}
                  onChange={(event) =>
                    setForm({ ...form, role: event.target.value as UserRole })
                  }
                >
                  {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                {editingUser?.id === user.id && (
                  <small>Your own Admin role can’t be changed here.</small>
                )}
              </label>
              {formError && <p className="notice notice-error form-message" role="alert">{formError}</p>}
              <div className="form-actions">
                <Button loading={isSaving}>
                  {isSaving ? "Saving..." : editingUser ? "Save changes" : "Create account"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        )}

        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="page-kicker">Directory</p>
              <h2 ref={directoryHeadingRef} tabIndex={-1}>
                All users <span className="count-chip">{users.length}</span>
              </h2>
            </div>
            <div className="directory-filters">
              <label className="visually-hidden" htmlFor="user-search">Search users</label>
              <Input
                id="user-search"
                type="search"
                placeholder="Search name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <label className="visually-hidden" htmlFor="role-filter">Filter by role</label>
              <select
                id="role-filter"
                className="control-input"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as UserRole | "All")}
              >
                <option value="All">All roles</option>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </div>

          {usersQuery.isLoading ? (
            <p className="empty-state" role="status">Loading accounts…</p>
          ) : usersQuery.isError ? (
            <div className="notice notice-error" role="alert">
              <p>{usersQuery.error.message}</p>
              <Button variant="secondary" onClick={() => void usersQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <Table
              columns={userColumns}
              data={filteredUsers}
              getRowKey={(managedUser) => managedUser.id}
              emptyState="No users match these filters."
            />
          )}
        </section>
      </div>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget ? `Delete ${deleteTarget.name}?` : "Delete account"}
        description="This permanently removes the account. Tickets stay in the system, are unassigned from this account, and comments are kept with the author marked as deleted."
        alertDialog
        initialFocusRef={deleteCancelRef}
        fallbackFocusRef={directoryHeadingRef}
        footer={
          <>
            <Button
              ref={deleteCancelRef}
              type="button"
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteUser.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteUser.isPending ? "Deleting…" : "Delete account"}
            </Button>
          </>
        }
      >
        <span className="dialog-warning" aria-hidden="true">!</span>
      </Modal>
    </main>
  );
}
