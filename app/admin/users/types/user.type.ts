export type UserStatus = "active" | "suspend";

export type UserRole =
  | "admin"
  | "director"
  | "headmaster"
  | "teacher"
  | "assistant"
  | "officer";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface QueryUsersResponse {
  isSuccess: boolean;
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

