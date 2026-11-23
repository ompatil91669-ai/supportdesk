import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  type TicketStatus,
} from "../features/tickets/api/tickets";
import {
  useAddTicketComment,
  useChangeTicketStatus,
  useTicket,
  useTicketComments,
} from "../features/tickets/hooks/useTickets";
import { useAuth } from "../lib/auth-context";

const ticketStatuses: TicketStatus[] = ["Open", "Pending", "Closed"];

export default function TicketDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const ticketQuery = useTicket(id);
  const commentsQuery = useTicketComments(id);
  const changeStatus = useChangeTicketStatus(id);
  const addComment = useAddTicketComment(id);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | "">("");
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const isAgent = user?.role === "Agent";
  const ticket = ticketQuery.data;
  const comments = commentsQuery.data ?? [];
  const visibleComments = isAgent
    ? comments
    : comments.filter((comment) => !comment.isInternal);

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    addComment.mutate(
      { content: trimmedContent, isInternal: isAgent && isInternal },
      {
        onSuccess: () => {
          setContent("");
          setIsInternal(false);
        },
      }
    );
  }

  if (ticketQuery.isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-cyan-50 p-6">
        <p role="status" className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
          Loading ticket...
        </p>
      </main>
    );
  }

  if (ticketQuery.isError || !ticket) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-cyan-50 p-6">
        <div role="alert" className="mx-auto max-w-4xl rounded-2xl bg-rose-50 p-6 text-rose-800">
          <p className="text-red-700">
            {ticketQuery.error instanceof Error
              ? ticketQuery.error.message
              : "Unable to load this ticket."}
          </p>
          <Link to="/tickets" className="mt-4 inline-block text-blue-700 underline">
            Back to tickets
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-cyan-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/tickets" className="inline-flex items-center gap-2 font-semibold text-indigo-700 underline hover:text-indigo-950">
          ← Back to tickets
        </Link>

        <section className="rounded-3xl border border-white bg-white p-6 shadow-xl shadow-indigo-950/5 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">Support request</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Ticket {ticket.id}
          </h1>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-bold uppercase tracking-wide text-slate-500">Customer</dt>
              <dd>{ticket.name}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-slate-500">Email</dt>
              <dd>{ticket.email}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-slate-500">Priority</dt>
              <dd>{ticket.priority}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-slate-500">Status</dt>
              <dd>{ticket.status}</dd>
            </div>
          </dl>

          {isAgent && (
            <form
              className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!selectedStatus || selectedStatus === ticket.status) return;
                changeStatus.mutate(selectedStatus, {
                  onSuccess: () => setSelectedStatus(""),
                });
              }}
            >
              <label className="grid gap-1 text-sm font-medium">
                Change status
                <select
                  aria-label="Change ticket status"
                  value={selectedStatus || ticket.status}
                  onChange={(event) =>
                    setSelectedStatus(event.target.value as TicketStatus)
                  }
                  className="rounded-xl border border-violet-200 bg-white p-2.5 outline-none focus:ring-4 focus:ring-violet-100"
                >
                  {ticketStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={
                  changeStatus.isPending ||
                  !selectedStatus ||
                  selectedStatus === ticket.status
                }
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 font-bold text-white shadow-md shadow-violet-500/20 disabled:opacity-50"
              >
                {changeStatus.isPending ? "Saving..." : "Update status"}
              </button>
              {changeStatus.isError && (
                <p role="alert" className="text-sm text-red-700">
                  {changeStatus.error.message}
                </p>
              )}
            </form>
          )}
        </section>

        <section className="rounded-3xl border border-white bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">Conversation</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Comments</h2>
          {commentsQuery.isLoading ? (
            <p role="status" className="mt-4 rounded-xl bg-slate-50 p-4 text-slate-600">
              Loading comments...
            </p>
          ) : commentsQuery.isError ? (
            <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-rose-700">
              {commentsQuery.error instanceof Error
                ? commentsQuery.error.message
                : "Unable to load comments."}
            </p>
          ) : visibleComments.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600">No comments yet. Start the conversation below.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {visibleComments.map((comment) => (
                <li
                  key={comment.id}
                  className={`rounded-2xl border p-4 ${
                    comment.isInternal
                      ? "border-amber-200 bg-amber-50/70"
                      : "border-sky-100 bg-gradient-to-r from-white to-sky-50/60"
                  }`}
                >
                  {comment.isInternal && (
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                      Internal note
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{comment.content}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {comment.authorId === ticket.userId ? "Customer" : "Agent"} ·{" "}
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <form className="mt-6 space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5" onSubmit={submitComment}>
            <label className="grid gap-1 text-sm font-medium">
              Add a comment
              <textarea
                aria-label="Add a comment"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={4}
                required
                maxLength={2000}
                className="rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </label>
            {isAgent && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(event) => setIsInternal(event.target.checked)}
                />
                Internal note (visible to agents only)
              </label>
            )}
            <button
              type="submit"
              disabled={addComment.isPending || !content.trim()}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 font-bold text-white shadow-md shadow-indigo-500/20 disabled:opacity-50"
            >
              {addComment.isPending ? "Sending..." : "Send comment"}
            </button>
            {addComment.isError && (
              <p role="alert" className="text-sm text-red-700">
                {addComment.error.message}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
