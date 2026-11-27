import { Link } from "react-router-dom";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { useAuth } from "../lib/auth-context";
import type { TicketPriority, TicketStatus } from "../features/tickets/api/tickets";
import { useTickets } from "../features/tickets/hooks/useTickets";

const statusBadgeVariant: Record<TicketStatus, "open" | "pending" | "closed"> = {
  Open: "open",
  Pending: "pending",
  Closed: "closed",
};

const priorityBadgeVariant: Record<TicketPriority, "low" | "medium" | "high"> = {
  Low: "low",
  Medium: "medium",
  High: "high",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useTickets({ limit: 5 });
  const tickets = data?.data ?? [];
  const isStaff = user?.role === "Agent" || user?.role === "Admin";
  const isAdmin = user?.role === "Admin";
  const ticketHeading = isStaff ? "All Tickets" : "Your Tickets";

  return (
    <main className="page-main">
      <div className="page-stack">
        <section className="page-heading">
          <div>
            <p className="page-kicker">
              {isAdmin ? "Admin workspace" : isStaff ? "Agent workspace" : "Customer portal"}
            </p>
            <h1>Dashboard</h1>
            <p className="page-description">
              Welcome back, <strong>{user?.name}</strong>. Here’s what’s happening today.
            </p>
          </div>
          <div className="row-actions">
            <Link to="/tickets" className="button button-secondary">Browse tickets</Link>
            {!isStaff && (
              <Link
                to="/tickets/new"
                aria-label="Create Ticket"
                className="button button-primary"
              >
                ＋ New ticket
              </Link>
            )}
          </div>
        </section>

        <section className="hero-panel">
          <p className="page-kicker hero-kicker">
            {isAdmin ? "Team operations" : "Support, in one place"}
          </p>
          <h2>{isStaff ? "Every request, moving forward." : "How can we help today?"}</h2>
          <p>
            {isAdmin
              ? "Keep customers, agents, and ticket assignments organized from one workspace."
              : isStaff
                ? "Review customer requests, share updates, and keep every conversation moving."
                : "Create a request or follow up on a conversation with your support team."}
          </p>
        </section>

        <section className="stats-grid" aria-label="Workspace overview">
          <article className="stat-card">
            <span className="stat-icon stat-icon-admin" aria-hidden="true">T</span>
            <div>
              <p>{ticketHeading}</p>
              <strong>{data?.meta.total ?? (isLoading ? "…" : "0")}</strong>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon stat-icon-agent" aria-hidden="true">R</span>
            <div>
              <p>Workspace</p>
              <strong className="stat-role">{user?.role}</strong>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon stat-icon-customer" aria-hidden="true">S</span>
            <div>
              <p>Recent requests</p>
              <strong>{tickets.length}</strong>
            </div>
          </article>
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="page-kicker">Latest activity</p>
              <h2 id="dashboard-tickets-heading">{ticketHeading}</h2>
              <p className="page-description">
                {isStaff
                  ? "Recent tickets across all customers."
                  : "Recent tickets associated with your account."}
              </p>
            </div>
            {data && (
              <span aria-label="Ticket count" className="count-chip">
                {data.meta.total} {data.meta.total === 1 ? "ticket" : "tickets"}
              </span>
            )}
          </div>

          {isLoading ? (
            <p role="status" className="empty-state">Loading tickets…</p>
          ) : isError ? (
            <div role="alert" className="notice notice-error">
              <span>{error instanceof Error ? error.message : "Unable to load tickets."}</span>
              <Button variant="secondary" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : tickets.length === 0 ? (
            <p className="empty-state">No tickets found yet.</p>
          ) : (
            <ul className="ticket-preview-list">
              {tickets.map((ticket) => (
                <li key={ticket.id} className="ticket-preview">
                  <div>
                    <Link
                      to={`/tickets/${encodeURIComponent(ticket.id)}`}
                      className="ticket-link"
                    >
                      {ticket.id}
                    </Link>
                    <p>{ticket.name}</p>
                  </div>
                  <div className="ticket-tags">
                    <Badge variant={statusBadgeVariant[ticket.status]}>
                      {ticket.status}
                    </Badge>
                    <Badge variant={priorityBadgeVariant[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link to="/tickets" className="text-link">View all tickets <span aria-hidden="true">→</span></Link>
        </section>
      </div>
    </main>
  );
}
