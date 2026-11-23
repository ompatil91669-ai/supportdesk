import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { Navigate } from "react-router-dom";
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
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
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

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;

    if (deleteTarget && !dialog.open) {
      dialog.showModal();
      deleteCancelRef.current?.focus();
    } else if (!deleteTarget && dialog.open) {
      dialog.close();
    }
  }, [deleteTarget]);

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
          <button
            type="button"
            className="button button-primary"
            onClick={openCreateForm}
          >
            <span aria-hidden="true">＋</span> Add user
          </button>
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
              <button
                type="button"
                className="button button-quiet"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </button>
            </div>
            <form className="user-form" onSubmit={submitUser}>
              <label className="field">
                <span>Full name</span>
                <input
                  ref={nameInputRef}
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Email address</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </label>
              {!editingUser && (
                <label className="field">
                  <span>Temporary password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                  />
                </label>
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
                <button className="button button-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingUser ? "Save changes" : "Create account"}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
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
              <input
                id="user-search"
                className="control-input"
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
              <button className="button button-secondary" onClick={() => void usersQuery.refetch()}>
                Try again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="empty-state">No users match these filters.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">Role</th>
                    <th scope="col">Joined</th>
                    <th scope="col"><span className="visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((managedUser) => (
                    <tr key={managedUser.id}>
                      <td>
                        <div className="user-cell">
                          <span className="avatar-token" aria-hidden="true">
                            {managedUser.name.trim().charAt(0).toUpperCase()}
                          </span>
                          <span><strong>{managedUser.name}</strong><small>{managedUser.email}</small></span>
                        </div>
                      </td>
                      <td><span className={`role-badge role-${managedUser.role.toLowerCase()}`}>{managedUser.role}</span></td>
                      <td>{new Date(managedUser.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="button button-small button-secondary"
                            onClick={(event) => openEditForm(managedUser, event)}
                            disabled={managedUser.id === user.id}
                            aria-label={`Edit ${managedUser.name}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button button-small button-danger"
                            onClick={(event) => {
                              deleteTriggerRef.current = event.currentTarget;
                              setDeleteTarget(managedUser);
                            }}
                            disabled={managedUser.id === user.id}
                            aria-label={`Delete ${managedUser.name}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <dialog
        ref={deleteDialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        aria-describedby="delete-user-description"
        onClose={() => {
          if (deleteTriggerRef.current?.isConnected) {
            deleteTriggerRef.current.focus();
          } else {
            directoryHeadingRef.current?.focus();
          }
          if (deleteTarget) {
            setDeleteTarget(null);
          }
        }}
      >
        {deleteTarget && (
          <>
            <span className="dialog-warning" aria-hidden="true">!</span>
            <h2 id="delete-user-title">Delete {deleteTarget.name}?</h2>
            <p id="delete-user-description">
              This permanently removes the account. Tickets stay in the system,
              are unassigned from this account, and comments are kept with the
              author marked as deleted.
            </p>
            <div className="form-actions">
              <button
                ref={deleteCancelRef}
                className="button button-secondary"
                onClick={() => {
                  deleteDialogRef.current?.close();
                  setDeleteTarget(null);
                }}
              >
                Cancel
              </button>
              <button
                className="button button-danger"
                disabled={deleteUser.isPending}
                onClick={() => void confirmDelete()}
              >
                {deleteUser.isPending ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </>
        )}
      </dialog>
    </main>
  );
}
