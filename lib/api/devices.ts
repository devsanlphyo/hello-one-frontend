import { apiClient } from "./client";

export type DeviceStatus = "pending" | "approved" | "rejected" | "revoked";

export interface UserDeviceItem {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: DeviceStatus;
  lastLoginAt: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    avatarUrl: string | null;
  };
}

export interface FetchDevicesParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DevicesResponse {
  isSuccess: boolean;
  items: UserDeviceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchDevices(params?: FetchDevicesParams): Promise<DevicesResponse> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());

  const qs = query.toString();
  return apiClient.get<DevicesResponse>(`/admin/devices${qs ? `?${qs}` : ""}`);
}

export async function fetchPendingDevicesCount(): Promise<{
  isSuccess: boolean;
  pendingCount: number;
}> {
  return apiClient.get<{ isSuccess: boolean; pendingCount: number }>("/admin/devices/pending-count");
}

export async function approveDevice(id: string): Promise<{
  isSuccess: boolean;
  message: string;
  data: UserDeviceItem;
}> {
  return apiClient.patch<{ isSuccess: boolean; message: string; data: UserDeviceItem }>(
    `/admin/devices/${id}/approve`,
    {},
  );
}

export async function rejectDevice(id: string): Promise<{
  isSuccess: boolean;
  message: string;
  data: UserDeviceItem;
}> {
  return apiClient.patch<{ isSuccess: boolean; message: string; data: UserDeviceItem }>(
    `/admin/devices/${id}/reject`,
    {},
  );
}

export async function revokeDevice(id: string): Promise<{
  isSuccess: boolean;
  message: string;
  data: UserDeviceItem;
}> {
  return apiClient.patch<{ isSuccess: boolean; message: string; data: UserDeviceItem }>(
    `/admin/devices/${id}/revoke`,
    {},
  );
}

export async function deleteDevice(id: string): Promise<{
  isSuccess: boolean;
  message: string;
}> {
  return apiClient.delete<{ isSuccess: boolean; message: string }>(`/admin/devices/${id}`);
}
