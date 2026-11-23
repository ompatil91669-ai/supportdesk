import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  createTicketComment,
  type TicketPriority,
} from "../features/tickets/api/tickets";
import { useCreateTicket } from "../features/tickets/hooks/useTickets";
import { useAuth } from "../lib/auth-context";

export default function TicketCreatePage() {
  const { user } = useAuth();
  const customer = user;
  const navigate = useNavigate();
  const createTicket = useCreateTicket();
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);

  if (!customer || customer.role !== "Customer") {
    return <Navigate to="/dashboard" replace />;
  }
  const customerName = customer.name;
  const customerEmail = customer.email;

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDescription = description.trim();
    if (!trimmedDescription) return;

    setError(null);
    setCreatedTicketId(null);
    setIsSubmitting(true);

    let ticket;
    try {
      ticket = await createTicket.mutateAsync({
        id: `TKT-${crypto.randomUUID()}`,
        name: customerName,
        email: customerEmail,
        priority,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create your ticket."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await createTicketComment(ticket.id, { content: trimmedDescription });
    } catch (requestError) {
      setCreatedTicketId(ticket.id);
      setError(
        `Ticket ${ticket.id} was created, but your message could not be saved. ${
          requestError instanceof Error
            ? requestError.message
            : "Open the ticket to add your message."
        }`
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    navigate(`/tickets/${encodeURIComponent(ticket.id)}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50 to-cyan-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <Link to="/dashboard" className="inline-flex items-center gap-2 font-semibold text-emerald-800 underline">
          ← Back to dashboard
        </Link>

        <section className="overflow-hidden rounded-3xl border border-white bg-white shadow-xl shadow-emerald-950/5">
          <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 p-6 text-white sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-100">
            Customer support
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Create a support ticket
          </h1>
          <p className="mt-2 text-sm leading-6 text-emerald-50">
            Tell us what you need help with. Your ticket will be linked to your
            account.
          </p>
          </div>

          <form className="space-y-4 p-6 sm:p-8" onSubmit={submitTicket}>
            <label className="grid gap-1 text-sm font-medium">
              Name
              <input
                aria-label="Name"
                value={customer.name}
                readOnly
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-600"
              />
            </label>

            <label className="grid gap-1 text-sm font-medium">
              Email
              <input
                aria-label="Email"
                type="email"
                value={customer.email}
                readOnly
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-600"
              />
            </label>

            <label className="grid gap-1 text-sm font-medium">
              Priority
              <select
                aria-label="Priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TicketPriority)
                }
                className="rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium">
              Describe your issue
              <textarea
                aria-label="Describe your issue"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                required
                maxLength={2000}
                className="rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            )}

            {createdTicketId && (
              <Link
                to={`/tickets/${encodeURIComponent(createdTicketId)}`}
                className="inline-block font-semibold text-emerald-800 underline"
              >
                Open created ticket
              </Link>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting || Boolean(createdTicketId) || !description.trim()
              }
              className="rounded-xl bg-gradient-to-r from-emerald-700 to-teal-600 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSubmitting
                ? "Creating..."
                : createdTicketId
                  ? "Ticket created"
                  : "Create Ticket"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
