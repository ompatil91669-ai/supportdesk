
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { useTickets } from "../features/tickets/hooks/useTickets";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { data, isLoading, isError, error, refetch } = useTickets({
    limit: 5,
  });
  const tickets = data?.data ?? [];
  const isAgent = user?.role === "Agent";
  const ticketHeading = isAgent ? "All Tickets" : "Your Tickets";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-cyan-50 md:flex">
      <aside className="bg-gradient-to-b from-slate-950 via-indigo-950 to-blue-950 p-6 text-white shadow-xl md:min-h-screen md:w-72">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-xl font-black shadow-lg shadow-blue-950/30">
            S
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">SupportDesk</h1>
            <p className="text-xs text-blue-200">Support workspace</p>
          </div>
        </div>

        <nav aria-label="Main navigation" className="mt-8">
          <Link
            to="/dashboard"
            className="block rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 font-semibold shadow-lg shadow-blue-950/30"
          >
            Dashboard
          </Link>

          <Link
            to="/tickets"
            className="mt-3 block rounded-xl px-4 py-3 text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            View Tickets
          </Link>
        </nav>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
            Signed in as
          </p>
          <p className="mt-2 font-semibold">{user?.role}</p>
          <p className="mt-1 truncate text-sm text-slate-300">{user?.email}</p>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-indigo-100 bg-white/85 p-5 shadow-sm backdrop-blur sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              {isAgent ? "Agent workspace" : "Customer portal"}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, <span className="font-semibold">{user?.name}</span>
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 font-semibold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-100"
          >
            Logout
          </button>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 p-6 text-white shadow-xl shadow-indigo-900/15 sm:p-8">
            <div aria-hidden="true" className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[34px] border-white/10" />
            <div aria-hidden="true" className="absolute -bottom-28 right-48 h-56 w-56 rounded-full bg-cyan-300/15 blur-2xl" />
            <div className="relative max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">
                Your support, in one place
              </p>
              <h3 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {isAgent ? "Ready to help?" : "How can we help today?"}
              </h3>
              <p className="mt-3 max-w-xl leading-7 text-blue-50">
                {isAgent
                  ? "Review customer requests, share updates, and keep every conversation moving."
                  : "Create a request or follow up on a conversation with our support team."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/tickets"
                  className="rounded-xl bg-white px-5 py-3 font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-white/40"
                >
                  Browse tickets
                </Link>
                {!isAgent && user && (
                  <Link
                    to="/tickets/new"
                    aria-label="Create Ticket"
                    className="rounded-xl border border-white/40 bg-white/15 px-5 py-3 font-bold text-white backdrop-blur transition hover:bg-white/25 focus:outline-none focus:ring-4 focus:ring-white/30"
                  >
                    + Create Ticket
                  </Link>
                )}
              </div>
            </div>
          </section>

          <section
            aria-labelledby="dashboard-tickets-heading"
            className="rounded-3xl border border-white bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3
                  id="dashboard-tickets-heading"
                  className="text-xl font-black tracking-tight text-slate-950"
                >
                  {ticketHeading}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isAgent
                    ? "Recent tickets across all customers."
                    : "Recent tickets associated with your account."}
                </p>
              </div>
              {data && (
                <p
                  aria-label="Ticket count"
                  className="rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 ring-1 ring-indigo-100"
                >
                  {data.meta.total} {data.meta.total === 1 ? "ticket" : "tickets"}
                </p>
              )}
            </div>

            {isLoading ? (
              <p role="status" className="mt-5 rounded-xl bg-slate-50 p-4 text-slate-600">
                Loading tickets...
              </p>
            ) : isError ? (
              <div role="alert" className="mt-5 rounded-xl bg-rose-50 p-4">
                <p className="text-red-700">
                  {error instanceof Error
                    ? error.message
                    : "Unable to load tickets."}
                </p>
                <button
                  onClick={() => void refetch()}
                  className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                >
                  Try Again
                </button>
              </div>
            ) : tickets.length === 0 ? (
              <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                No tickets found yet.
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {tickets.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-slate-50 px-4 py-4 transition hover:border-indigo-100 hover:shadow-md"
                  >
                    <div>
                      <Link
                        to={`/tickets/${encodeURIComponent(ticket.id)}`}
                        className="font-bold text-indigo-700 underline decoration-indigo-200 underline-offset-4 hover:text-indigo-950"
                      >
                        {ticket.id}
                      </Link>
                      <p className="text-sm text-slate-600">{ticket.name}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-800">
                        {ticket.status}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">{ticket.priority}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <Link
              to="/tickets"
              className="mt-5 inline-flex items-center gap-2 font-bold text-indigo-700 hover:text-indigo-900"
            >
              View all tickets <span aria-hidden="true">→</span>
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
