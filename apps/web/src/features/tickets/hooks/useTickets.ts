
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  changeTicketStatus,
  assignTicket,
  createTicket,
  createTicketComment,
  getAssignableAgents,
  getTicket,
  getTicketComments,
  getTickets,
  type CreateCommentInput,
  type CreateTicketInput,
  type TicketFilters,
  type TicketStatus,
} from "../api/tickets";

export const ticketKeys = {
  all: ["tickets"] as const,

  lists: () => [...ticketKeys.all, "list"] as const,

  list: (filters: TicketFilters) =>
    [...ticketKeys.lists(), filters] as const,

  details: () => [...ticketKeys.all, "detail"] as const,

  detail: (id: string) =>
    [...ticketKeys.details(), id] as const,

  assignableAgents: ["users", "assignable-agents"] as const,

  comments: (id: string) =>
    [...ticketKeys.all, "comments", id] as const,
};

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () => getTickets(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => getTicket(id),
    enabled: Boolean(id),
  });
}

export function useAssignableAgents(enabled = true) {
  return useQuery({
    queryKey: ticketKeys.assignableAgents,
    queryFn: getAssignableAgents,
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTicketInput) => createTicket(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useTicketComments(id: string) {
  return useQuery({
    queryKey: ticketKeys.comments(id),
    queryFn: () => getTicketComments(id),
    enabled: Boolean(id),
  });
}

export function useChangeTicketStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: TicketStatus) => changeTicketStatus(id, status),
    onSuccess: async (ticket) => {
      queryClient.setQueryData(ticketKeys.detail(id), ticket);
      await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useAssignTicket(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assigneeId: string | null) => assignTicket(id, assigneeId),
    onSuccess: async (ticket) => {
      queryClient.setQueryData(ticketKeys.detail(id), ticket);
      await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useAddTicketComment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentInput) =>
      createTicketComment(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ticketKeys.comments(id),
      });
    },
  });
}
