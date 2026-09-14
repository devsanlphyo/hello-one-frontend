import { apiClient } from "./client";

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveUserSummary {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export interface LeaveRequestItem {
  id: string;
  userId: string;
  user?: LeaveUserSummary;
  schoolId: string | null;
  school?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: LeaveStatus;
  reviewedById: string | null;
  reviewedBy?: LeaveUserSummary | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveInput {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateLeaveStatusInput {
  status: "approved" | "rejected";
  reviewNotes?: string;
}

export interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  onLeaveToday: number;
}

/**
 * 1. Submit a new leave request (Staff)
 */
export async function submitLeaveRequest(
  input: CreateLeaveInput,
): Promise<LeaveRequestItem> {
  return apiClient.post<LeaveRequestItem>("/leaves", input);
}

/**
 * 2. Fetch current caller's own leave requests (Staff)
 */
export async function fetchMyLeaveRequests(): Promise<LeaveRequestItem[]> {
  return apiClient.get<LeaveRequestItem[]>("/leaves/my");
}

/**
 * 3. Fetch school-specific leave requests (Headmaster / Director)
 */
export async function fetchSchoolLeaveRequests(
  schoolId?: string,
  status?: string,
): Promise<LeaveRequestItem[]> {
  const params = new URLSearchParams();
  if (schoolId) params.set("schoolId", schoolId);
  if (status && status !== "all") params.set("status", status);

  const qs = params.toString();
  return apiClient.get<LeaveRequestItem[]>(`/leaves/school${qs ? `?${qs}` : ""}`);
}

/**
 * 4. Fetch cross-campus leave requests (Director / Admin)
 */
export async function fetchDirectorLeaveRequests(params?: {
  schoolId?: string;
  status?: string;
  search?: string;
}): Promise<LeaveRequestItem[]> {
  const q = new URLSearchParams();
  if (params?.schoolId && params.schoolId !== "all") {
    q.set("schoolId", params.schoolId);
  }
  if (params?.status && params.status !== "all") {
    q.set("status", params.status);
  }
  if (params?.search) {
    q.set("search", params.search);
  }

  const qs = q.toString();
  return apiClient.get<LeaveRequestItem[]>(`/leaves${qs ? `?${qs}` : ""}`);
}

/**
 * 5. Fetch leave KPI metrics
 */
export async function fetchLeaveStats(schoolId?: string): Promise<LeaveStats> {
  const qs = schoolId ? `?schoolId=${schoolId}` : "";
  return apiClient.get<LeaveStats>(`/leaves/stats${qs}`);
}

/**
 * 6. Update request status (Headmaster / Director: Approve or Reject)
 */
export async function updateLeaveRequestStatus(
  id: string,
  input: UpdateLeaveStatusInput,
): Promise<LeaveRequestItem> {
  return apiClient.patch<LeaveRequestItem>(`/leaves/${id}/status`, input);
}
