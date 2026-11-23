import { apiRequest } from "../../../lib/api-client";
import type { UserRole } from "../../../lib/api-client";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManagedUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export type UpdateManagedUserInput = Partial<
  Pick<ManagedUser, "name" | "email" | "role">
>;

export function getManagedUsers(): Promise<ManagedUser[]> {
  return apiRequest<ManagedUser[]>("/users");
}

export function createManagedUser(
  input: CreateManagedUserInput
): Promise<ManagedUser> {
  return apiRequest<ManagedUser>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateManagedUser(
  id: string,
  input: UpdateManagedUserInput
): Promise<ManagedUser> {
  return apiRequest<ManagedUser>(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteManagedUser(id: string): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
