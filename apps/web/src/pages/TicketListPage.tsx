import { useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/Badge";
import type { BadgeVariant } from "../components/Badge";
import Button from "../components/Button";
import Input from "../components/Input";
import Table, { type TableColumn } from "../components/Table";
import { useTickets } from "../features/tickets/hooks/useTickets";
import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../features/tickets/api/tickets";

const statusBadgeVariant: Record<TicketStatus, BadgeVariant> = {
  Open: "open",
  Pending: "pending",
  Closed: "closed",
};

const priorityBadgeVariant: Record<TicketPriority, BadgeVariant> = {
  Low: "low",
  Medium: "medium",
  High: "high",
};

const ticketColumns: TableColumn<Ticket>[] = [
  {
    key: "ticket",
    header: "Ticket",
    render: (ticket) => (
      <Link
        to={`/tickets/${encodeURIComponent(ticket.id)}`}
        className="ticket-link"
        aria-label={`Open ticket ${ticket.id}`}
      >
        {ticket.id}
      </Link>
    ),
  },
  { key: "customer", header: "Customer", render: (ticket) => <span className="table-strong">{ticket.name}</span> },
  { key: "email", header: "Email", render: (ticket) => ticket.email },
  {
    key: "status",
    header: "Status",
    render: (ticket) => (
      <Badge variant={statusBadgeVariant[ticket.status]}>
        {ticket.status}
      </Badge>
    ),
  },
  {
    key: "priority",
    header: "Priority",
    render: (ticket) => (
      <Badge variant={priorityBadgeVariant[ticket.priority]}>
        {ticket.priority}
      </Badge>
    ),
  },
  {
    key: "created",
    header: "Created",
    render: (ticket) => new Date(ticket.createdAt).toLocaleDateString(),
  },
];

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
          <Input
            wrapperClassName="filter-field"
            label="Search"
            type="search"
            placeholder="Name, email, or ticket ID"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
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
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
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
            <Table
              columns={ticketColumns}
              data={tickets}
              getRowKey={(ticket) => ticket.id}
              emptyState="No tickets match these filters."
            />
            <div className="pagination-bar">
              <p>
                Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
                {data && <span> · {data.meta.total} results</span>}
              </p>
              <div className="row-actions">
                <Button
                  variant="secondary"
                  aria-label="Previous page"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((current) => current - 1)}
                >
                  ← Previous
                </Button>
                <Button
                  variant="secondary"
                  aria-label="Next page"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next →
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
