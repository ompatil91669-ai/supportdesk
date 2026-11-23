import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createManagedUser,
  deleteManagedUser,
  getManagedUsers,
  updateManagedUser,
  type CreateManagedUserInput,
  type UpdateManagedUserInput,
} from "../api/users";

export const managedUserKey = ["managed-users"] as const;

export function useManagedUsers() {
  return useQuery({
    queryKey: managedUserKey,
    queryFn: getManagedUsers,
    staleTime: 30_000,
  });
}

export function useCreateManagedUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateManagedUserInput) => createManagedUser(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: managedUserKey });
    },
  });
}

export function useUpdateManagedUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateManagedUserInput;
    }) => updateManagedUser(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: managedUserKey });
    },
  });
}

export function useDeleteManagedUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteManagedUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: managedUserKey });
    },
  });
}
