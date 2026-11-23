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
    <main className="page-main">
      <div className="page-stack create-ticket-layout">
        <Link to="/dashboard" className="text-link">
          ← Back to dashboard
        </Link>

        <section className="surface-card create-ticket-card">
          <div className="create-ticket-heading">
            <p className="page-kicker">Customer support</p>
            <h1>Create a support ticket</h1>
            <p>
              Tell us what you need help with. Your ticket will be linked to your
              account.
            </p>
          </div>

          <form className="ticket-create-form" onSubmit={submitTicket}>
            <label className="field">
              <span>Name</span>
              <input
                aria-label="Name"
                value={customer.name}
                readOnly
                className="control-input"
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                aria-label="Email"
                type="email"
                value={customer.email}
                readOnly
                className="control-input"
              />
            </label>

            <label className="field">
              <span>Priority</span>
              <select
                aria-label="Priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TicketPriority)
                }
                className="control-input"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <label className="field">
              <span>Describe your issue</span>
              <textarea
                aria-label="Describe your issue"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                required
                maxLength={2000}
                className="control-input"
              />
            </label>

            {error && (
              <p role="alert" className="notice notice-error">
                {error}
              </p>
            )}

            {createdTicketId && (
              <Link
                to={`/tickets/${encodeURIComponent(createdTicketId)}`}
                className="text-link"
              >
                Open created ticket
              </Link>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting || Boolean(createdTicketId) || !description.trim()
              }
              className="button button-primary"
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
