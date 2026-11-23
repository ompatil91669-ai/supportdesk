import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  type TicketStatus,
} from "../features/tickets/api/tickets";
import {
  useAddTicketComment,
  useAssignableAgents,
  useAssignTicket,
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
  const isAdmin = user?.role === "Admin";
  const isStaff = user?.role === "Agent" || isAdmin;
  const agentsQuery = useAssignableAgents(isAdmin);
  const assignTicket = useAssignTicket(id);
  const addComment = useAddTicketComment(id);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | "">("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const ticket = ticketQuery.data;
  const comments = commentsQuery.data ?? [];
  const visibleComments = isStaff
    ? comments
    : comments.filter((comment) => !comment.isInternal);

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    addComment.mutate(
      { content: trimmedContent, isInternal: isStaff && isInternal },
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
      <main className="page-main">
        <p role="status" className="empty-state">
          Loading ticket...
        </p>
      </main>
    );
  }

  if (ticketQuery.isError || !ticket) {
    return (
      <main className="page-main">
        <div role="alert" className="notice notice-error">
          <p>
            {ticketQuery.error instanceof Error
              ? ticketQuery.error.message
              : "Unable to load this ticket."}
          </p>
          <Link to="/tickets" className="text-link">
            Back to tickets
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-main">
      <div className="page-stack ticket-detail-layout">
        <Link to="/tickets" className="text-link">
          ← Back to tickets
        </Link>

        <section className="surface-card ticket-summary-card">
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
            {isAdmin && (
              <div>
                <dt className="font-bold uppercase tracking-wide text-slate-500">Assigned agent</dt>
                <dd>
                  {agentsQuery.data?.find((agent) => agent.id === ticket.assigneeId)?.name
                    ?? (ticket.assigneeId ? "Assigned agent" : "Unassigned")}
                </dd>
              </div>
            )}
          </dl>

          {isStaff && (
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

          {isAdmin && (
            <form
              className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                const nextAssigneeId =
                  selectedAssigneeId ?? ticket.assigneeId ?? "";
                if (nextAssigneeId === (ticket.assigneeId ?? "")) return;
                assignTicket.mutate(nextAssigneeId || null, {
                  onSuccess: () => setSelectedAssigneeId(null),
                });
              }}
            >
              <label className="grid gap-1 text-sm font-medium">
                Assign to agent
                <select
                  aria-label="Assign ticket to agent"
                  value={selectedAssigneeId ?? ticket.assigneeId ?? ""}
                  onChange={(event) => setSelectedAssigneeId(event.target.value)}
                  disabled={agentsQuery.isLoading || agentsQuery.isError}
                  className="min-w-64 rounded-xl border border-sky-200 bg-white p-2.5 outline-none focus:ring-4 focus:ring-sky-100 disabled:opacity-50"
                >
                  <option value="">Unassigned</option>
                  {(agentsQuery.data ?? []).map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={
                  assignTicket.isPending ||
                  agentsQuery.isLoading ||
                  agentsQuery.isError ||
                  (selectedAssigneeId ?? ticket.assigneeId ?? "") ===
                    (ticket.assigneeId ?? "")
                }
                className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2.5 font-bold text-white shadow-md shadow-sky-500/20 disabled:opacity-50"
              >
                {assignTicket.isPending ? "Saving..." : "Save assignment"}
              </button>
              {agentsQuery.isError && (
                <p role="alert" className="text-sm text-red-700">
                  {agentsQuery.error.message}
                </p>
              )}
              {assignTicket.isError && (
                <p role="alert" className="text-sm text-red-700">
                  {assignTicket.error.message}
                </p>
              )}
            </form>
          )}
        </section>

        <section className="surface-card conversation-card">
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
                    {!comment.authorId
                      ? "Former user"
                      : comment.authorId === ticket.userId
                        ? "Customer"
                        : "Support team"} ·{" "}
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
            {isStaff && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(event) => setIsInternal(event.target.checked)}
                />
                Internal note (visible to agents and admins)
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
