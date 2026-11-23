import { useState } from "react";
import { Link } from "react-router-dom";
import { useTickets } from "../features/tickets/hooks/useTickets";
import type {
  TicketPriority,
  TicketStatus,
} from "../features/tickets/api/tickets";

export default function TicketListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");

  const { data, isLoading, isFetching, isError, error, refetch } = useTickets({
    page,
    limit: 10,
    search: search.trim() || undefined,
    status: status || undefined,
    priority: priority || undefined,
  });

  const tickets = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <main className="page-main">
      <div className="page-stack">
        <section className="page-heading">
          <div>
            <p className="page-kicker">Support workspace</p>
            <h1>Support tickets</h1>
            <p className="page-description">
              Search, review, and follow up on support requests.
            </p>
          </div>
          <span className="total-pill">{data?.meta.total ?? "—"} total</span>
        </section>

        <section className="surface-card filter-card" aria-label="Ticket filters">
          <label className="filter-field">
            <span>Search</span>
            <input
              aria-label="Search tickets"
              type="search"
              placeholder="Name, email, or ticket ID"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="filter-field">
            <span>Status</span>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as TicketStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Closed">Closed</option>
            </select>
          </label>
          <label className="filter-field">
            <span>Priority</span>
            <select
              aria-label="Filter by priority"
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value as TicketPriority | "");
                setPage(1);
              }}
            >
              <option value="">All priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
        </section>

        {isLoading ? (
          <p role="status" className="empty-state">Loading tickets…</p>
        ) : isError ? (
          <div role="alert" className="notice notice-error">
            <span>{error instanceof Error ? error.message : "Unable to load tickets."}</span>
            <button className="button button-secondary" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : (
          <section className="surface-card ticket-table-card">
            <div className="section-heading">
              <div>
                <p className="page-kicker">Ticket queue</p>
                <h2>Requests</h2>
              </div>
              {isFetching && <span className="updating-indicator">Updating…</span>}
            </div>
            {tickets.length === 0 ? (
              <p className="empty-state">No tickets match these filters.</p>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Ticket</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Email</th>
                      <th scope="col">Status</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <Link
                            to={`/tickets/${encodeURIComponent(ticket.id)}`}
                            className="ticket-link"
                            aria-label={`Open ticket ${ticket.id}`}
                          >
                            {ticket.id}
                          </Link>
                        </td>
                        <td className="table-strong">{ticket.name}</td>
                        <td>{ticket.email}</td>
                        <td>
                          <span className={`status-tag status-${ticket.status.toLowerCase()}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td>
                          <span className={`priority-tag priority-${ticket.priority.toLowerCase()}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="pagination-bar">
              <p>
                Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
                {data && <span> · {data.meta.total} results</span>}
              </p>
              <div className="row-actions">
                <button
                  className="button button-secondary"
                  aria-label="Previous page"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((current) => current - 1)}
                >
                  ← Previous
                </button>
                <button
                  className="button button-secondary"
                  aria-label="Next page"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
