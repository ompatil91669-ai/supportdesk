import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export default function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "Admin";
  const isCustomer = user?.role === "Customer";

  return (
    <div className="workspace-frame">
      <a className="skip-link" href="#workspace-main">
        Skip to main content
      </a>
      <aside aria-label="Workspace sidebar" className="workspace-sidebar">
        <NavLink to="/dashboard" className="workspace-brand">
          <span aria-hidden="true" className="brand-mark">S</span>
          <span>
            <strong>SupportDesk</strong>
            <small>Support workspace</small>
          </span>
        </NavLink>

        <nav aria-label="Main navigation" className="workspace-nav">
          <span className="nav-section-label">Workspace</span>
          <NavLink to="/dashboard" end>
            Overview
          </NavLink>
          <NavLink to="/tickets">Tickets</NavLink>
          {isCustomer && <NavLink to="/tickets/new">New ticket</NavLink>}
          {isAdmin && <NavLink to="/admin/users">User management</NavLink>}
        </nav>

        <div className="workspace-account">
          <div className="account-copy">
            <span className={`role-badge role-${user?.role.toLowerCase()}`}>
              {user?.role}
            </span>
            <strong>{user?.name}</strong>
          </div>
          <button
            type="button"
            className="button button-quiet"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="workspace-content" id="workspace-main" tabIndex={-1}>
        <Outlet />
      </div>
    </div>
  );
}
