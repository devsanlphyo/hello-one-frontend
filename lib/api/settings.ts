import { apiClient } from "./client";

export interface AppSettingsData {
  id: number;
  logoUrl: string | null;
  requireDeviceApproval?: boolean;
  bypassApprovalRoles?: string[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchSettings(): Promise<{
  isSuccess: boolean;
  data: AppSettingsData;
}> {
  return apiClient.get<{ isSuccess: boolean; data: AppSettingsData }>("/settings");
}

export async function uploadLogo(file: File): Promise<{
  isSuccess: boolean;
  message: string;
  data: AppSettingsData;
}> {
  const formData = new FormData();
  formData.append("logo", file);

  return apiClient.upload<{
    isSuccess: boolean;
    message: string;
    data: AppSettingsData;
  }>("/settings/logo", formData);
}

export async function removeLogo(): Promise<{
  isSuccess: boolean;
  message: string;
  data: AppSettingsData;
}> {
  return apiClient.delete<{
    isSuccess: boolean;
    message: string;
    data: AppSettingsData;
  }>("/settings/logo");
}

export async function updateSecuritySettings(body: {
  requireDeviceApproval?: boolean;
  bypassApprovalRoles?: string[];
}): Promise<{
  isSuccess: boolean;
  message: string;
  data: AppSettingsData;
}> {
  return apiClient.patch<{
    isSuccess: boolean;
    message: string;
    data: AppSettingsData;
  }>("/settings/security", body);
}
