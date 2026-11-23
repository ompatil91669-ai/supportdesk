
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

  const { data, isLoading, isFetching, isError, error, refetch } =
    useTickets({
      page,
      limit: 10,
      search: search.trim() || undefined,
      status: status || undefined,
      priority: priority || undefined,
    });

  const tickets = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-violet-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
              Support workspace
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              Support Tickets
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              View and manage support requests.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-indigo-900"
          >
            Dashboard
          </Link>
        </div>

        <section className="mb-6 grid gap-4 rounded-3xl border border-white bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur md:grid-cols-3">
          <input
            aria-label="Search tickets"
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />

          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as TicketStatus | "");
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Pending">Pending</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            aria-label="Filter by priority"
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value as TicketPriority | "");
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </section>

        {isLoading ? (
          <p role="status" className="rounded-2xl bg-white p-6 shadow-sm">
            Loading tickets...
          </p>
        ) : isError ? (
          <div role="alert" className="rounded-2xl bg-rose-50 p-6 text-rose-800">
            <p className="text-red-700">
              {error instanceof Error
                ? error.message
                : "Unable to load tickets."}
            </p>
            <button
              onClick={() => void refetch()}
              className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-3xl border border-white bg-white shadow-xl shadow-slate-900/5">
              <table className="w-full text-left text-sm">
                <thead className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white">
                  <tr>
                    <th className="p-4">Ticket ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t border-slate-100 transition hover:bg-indigo-50/50">
                      <td className="p-4 font-medium">
                        <Link
                          to={`/tickets/${encodeURIComponent(ticket.id)}`}
                          className="font-semibold text-indigo-700 underline decoration-indigo-200 underline-offset-4 hover:text-indigo-950"
                        >
                          {ticket.id}
                        </Link>
                      </td>
                      <td className="p-4">{ticket.name}</td>
                      <td className="p-4">{ticket.email}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-800">
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {tickets.length === 0 && (
                <p className="p-8 text-center text-slate-500">
                  No tickets match these filters.
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages || 1}
                {isFetching ? " · Updating..." : ""}
              </p>

              <div className="flex gap-2">
                <button
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-indigo-900 disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-indigo-900 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
