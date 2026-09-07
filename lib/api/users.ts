import type {
  QueryUsersParams,
  QueryUsersResponse,
  User,
  UserRole,
  UserStatus,
} from "@/app/admin/users/types/user.type";
import { apiClient } from "./client";

export async function fetchUsers(
  params: QueryUsersParams = {},
): Promise<QueryUsersResponse> {
  const query = new URLSearchParams();

  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search && params.search.trim() !== "")
    query.append("search", params.search.trim());
  if (params.role && params.role !== "default" && params.role !== "all")
    query.append("role", params.role);
  if (params.status && params.status !== "default" && params.status !== "all")
    query.append("status", params.status);

  return apiClient.get<QueryUsersResponse>(`/users?${query.toString()}`);
}

export async function fetchUserById(
  id: string,
): Promise<{ isSuccess: boolean; user: User }> {
  return apiClient.get<{ isSuccess: boolean; user: User }>(`/users/${id}`);
}

export async function createUser(data: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
}): Promise<{ isSuccess: boolean; message: string; user: User }> {
  return apiClient.post<{ isSuccess: boolean; message: string; user: User }>(
    "/auth/register",
    data,
  );
}

export async function updateUser(
  id: string,
  data: Partial<{
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    password: string;
  }>,
): Promise<{ isSuccess: boolean; message: string; user: User }> {
  return apiClient.patch<{ isSuccess: boolean; message: string; user: User }>(
    `/users/${id}`,
    data,
  );
}

export async function suspendUser(
  id: string,
): Promise<{ isSuccess: boolean; message: string }> {
  return apiClient.delete<{ isSuccess: boolean; message: string }>(`/users/${id}`);
}

export async function uploadMyAvatar(file: File): Promise<{
  isSuccess: boolean;
  message: string;
  user: User;
}> {
  const formData = new FormData();
  formData.append("avatar", file);

  return apiClient.upload<{
    isSuccess: boolean;
    message: string;
    user: User;
  }>("/users/me/avatar", formData);
}

export async function removeMyAvatar(): Promise<{
  isSuccess: boolean;
  message: string;
  user: User;
}> {
  return apiClient.delete<{
    isSuccess: boolean;
    message: string;
    user: User;
  }>("/users/me/avatar");
}

export async function uploadUserAvatar(
  id: string,
  file: File,
): Promise<{
  isSuccess: boolean;
  message: string;
  user: User;
}> {
  const formData = new FormData();
  formData.append("avatar", file);

  return apiClient.upload<{
    isSuccess: boolean;
    message: string;
    user: User;
  }>(`/users/${id}/avatar`, formData);
}

export async function removeUserAvatar(
  id: string,
): Promise<{
  isSuccess: boolean;
  message: string;
  user: User;
}> {
  return apiClient.delete<{
    isSuccess: boolean;
    message: string;
    user: User;
  }>(`/users/${id}/avatar`);
}
