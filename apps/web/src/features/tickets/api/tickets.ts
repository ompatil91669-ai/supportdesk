
import {
  apiRequest,
  apiRequestWithMeta,
  streamApiRequest,
  type StreamApiCallbacks,
} from "../../../lib/api-client";

export type TicketStatus = "Open" | "Closed" | "Pending";
export type TicketPriority = "Low" | "Medium" | "High";

export interface Ticket {
  id: string;
  name: string;
  email: string;
  status: TicketStatus;
  priority: TicketPriority;
  userId: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignableAgent {
  id: string;
  name: string;
  email: string;
}

export interface TicketComment {
  id: string;
  content: string;
  isInternal: boolean;
  ticketId: string;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  content: string;
  isInternal?: boolean;
}

export interface CreateTicketInput {
  id: string;
  name: string;
  email: string;
  priority: TicketPriority;
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
}

export interface TicketListResponse {
  data: Ticket[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type AiCategory =
  | "Technical"
  | "Billing"
  | "Account"
  | "General"
  | "Other";

export interface CategoriseTicketSuggestion {
  category: AiCategory;
  priority: TicketPriority;
}

export interface SuggestReplyStreamCallbacks {
  onDelta: (text: string) => void;
  onComplete: () => void;
  onError: (code: string, message: string) => void;
  onInterrupted: () => void;
}

export async function getTickets(
  filters: TicketFilters = {}
): Promise<TicketListResponse> {
  const params = new URLSearchParams();

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.priority) {
    params.set("priority", filters.priority);
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const query = params.toString();

  const response = await apiRequestWithMeta<Ticket[]>(
    `/tickets${query ? `?${query}` : ""}`
  );

  return {
    data: response.data ?? [],
    meta: {
      page: Number(response.meta.page),
      limit: Number(response.meta.limit),
      total: Number(response.meta.total),
      totalPages: Number(response.meta.totalPages),
    },
  };
}

export function getTicket(id: string): Promise<Ticket> {
  return apiRequest<Ticket>(`/tickets/${encodeURIComponent(id)}`);
}

export function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return apiRequest<Ticket>("/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getTicketComments(id: string): Promise<TicketComment[]> {
  return apiRequest<TicketComment[]>(
    `/tickets/${encodeURIComponent(id)}/comments`
  );
}

export function changeTicketStatus(
  id: string,
  status: TicketStatus
): Promise<Ticket> {
  return apiRequest<Ticket>(`/tickets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getAssignableAgents(): Promise<AssignableAgent[]> {
  return apiRequest<AssignableAgent[]>("/users/agents");
}

export function assignTicket(
  id: string,
  assigneeId: string | null
): Promise<Ticket> {
  return apiRequest<Ticket>(`/tickets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ assigneeId }),
  });
}

export function createTicketComment(
  id: string,
  input: CreateCommentInput
): Promise<TicketComment> {
  return apiRequest<TicketComment>(
    `/tickets/${encodeURIComponent(id)}/comments`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function categoriseTicket(
  id: string
): Promise<CategoriseTicketSuggestion> {
  return apiRequest<CategoriseTicketSuggestion>(
    `/tickets/${encodeURIComponent(id)}/ai/categorise`,
    { method: "POST" }
  );
}

export async function suggestTicketReply(
  id: string,
  callbacks: StreamApiCallbacks
): Promise<void> {
  await streamApiRequest(
    `/tickets/${encodeURIComponent(id)}/ai/suggest-reply`,
    callbacks,
    { method: "POST" }
  );
}