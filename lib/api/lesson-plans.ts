import { apiClient } from "./client";

export type LessonPlanStatus = "pending" | "reviewed" | "needs_revision";

export interface LessonPlanItem {
  id: string;
  teacherId: string;
  teacher?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  schoolId: string | null;
  school?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  classId: string | null;
  class?: {
    id: string;
    name: string;
    gradeLevel?: string;
  } | null;
  subjectId: string | null;
  subject?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  date: string; // YYYY-MM-DD
  title: string;
  topic: string | null;
  objectives: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  isLate: boolean;
  justification: string | null;
  status: LessonPlanStatus;
  reviewedById: string | null;
  reviewedBy?: {
    id: string;
    fullName: string;
  } | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLessonPlanStatus {
  date: string;
  teacher: {
    id: string;
    fullName: string;
    email: string;
    schoolName: string;
  };
  isLeaveDay: boolean;
  leaveDetails: {
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    reviewedAt?: string | null;
  } | null;
  isDutyDay: boolean;
  shiftDetails: {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    color: string;
  } | null;
  todayPlans: LessonPlanItem[];
  isExempted: boolean;
  hasSubmitted: boolean;
}

export interface CreateLessonPlanInput {
  date: string;
  title: string;
  topic?: string;
  objectives?: string;
  classId?: string;
  subjectId?: string;
  justification?: string;
  file?: File;
}

export interface CampusLessonPlansResponse {
  date: string;
  summary: {
    totalTeachers: number;
    submittedCount: number;
    excusedOnLeaveCount: number;
    missingCount: number;
    pendingReviewCount: number;
    reviewedCount: number;
    complianceRate: number;
  };
  plans: LessonPlanItem[];
  excusedStaff: {
    leaveId: string;
    teacherId: string;
    reason: string;
    startDate: string;
    endDate: string;
  }[];
}

export interface DirectorLessonPlansResponse {
  date: string;
  summary: {
    totalCampuses: number;
    totalSubmitted: number;
    totalReviewed: number;
    totalPending: number;
  };
  campusMetrics: {
    schoolId: string;
    schoolName: string;
    campusCode?: string;
    teacherCount: number;
    submittedCount: number;
    approvedLeaves: number;
    reviewedCount: number;
    complianceRate: number;
  }[];
  plans: LessonPlanItem[];
}

/**
 * 1. Fetch teacher's daily flowchart status (IsLeaveDay?, IsDutyDay?)
 */
export async function fetchDailyLessonPlanStatus(
  date?: string,
): Promise<DailyLessonPlanStatus> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiClient.get<DailyLessonPlanStatus>(`/lesson-plans/daily-status${query}`);
}

/**
 * 2. Submit a new lesson plan (with optional attachment up to 100MB)
 */
export async function submitLessonPlan(
  input: CreateLessonPlanInput,
): Promise<LessonPlanItem> {
  if (input.file) {
    const formData = new FormData();
    formData.append("date", input.date);
    formData.append("title", input.title);
    if (input.topic) formData.append("topic", input.topic);
    if (input.objectives) formData.append("objectives", input.objectives);
    if (input.classId) formData.append("classId", input.classId);
    if (input.subjectId) formData.append("subjectId", input.subjectId);
    if (input.justification) formData.append("justification", input.justification);
    formData.append("file", input.file);

    return apiClient.upload<LessonPlanItem>("/lesson-plans", formData);
  }

  return apiClient.post<LessonPlanItem>("/lesson-plans", {
    date: input.date,
    title: input.title,
    topic: input.topic,
    objectives: input.objectives,
    classId: input.classId,
    subjectId: input.subjectId,
    justification: input.justification,
  });
}

/**
 * 3. Fetch current teacher's lesson plans
 */
export async function fetchMyLessonPlans(params?: {
  date?: string;
  status?: string;
  search?: string;
}): Promise<LessonPlanItem[]> {
  const sp = new URLSearchParams();
  if (params?.date) sp.append("date", params.date);
  if (params?.status && params.status !== "all") sp.append("status", params.status);
  if (params?.search) sp.append("search", params.search);

  const qs = sp.toString();
  return apiClient.get<LessonPlanItem[]>(`/lesson-plans/my${qs ? `?${qs}` : ""}`);
}

/**
 * 4. Fetch campus lesson plans for Headmaster
 */
export async function fetchCampusLessonPlans(params?: {
  date?: string;
  status?: string;
  search?: string;
  schoolId?: string;
}): Promise<CampusLessonPlansResponse> {
  const sp = new URLSearchParams();
  if (params?.date) sp.append("date", params.date);
  if (params?.status && params.status !== "all") sp.append("status", params.status);
  if (params?.search) sp.append("search", params.search);
  if (params?.schoolId) sp.append("schoolId", params.schoolId);

  const qs = sp.toString();
  return apiClient.get<CampusLessonPlansResponse>(`/lesson-plans/school${qs ? `?${qs}` : ""}`);
}

/**
 * 5. Fetch all lesson plans across campuses for Director
 */
export async function fetchDirectorLessonPlans(params?: {
  date?: string;
  status?: string;
  search?: string;
  schoolId?: string;
}): Promise<DirectorLessonPlansResponse> {
  const sp = new URLSearchParams();
  if (params?.date) sp.append("date", params.date);
  if (params?.status && params.status !== "all") sp.append("status", params.status);
  if (params?.search) sp.append("search", params.search);
  if (params?.schoolId && params.schoolId !== "all") sp.append("schoolId", params.schoolId);

  const qs = sp.toString();
  return apiClient.get<DirectorLessonPlansResponse>(`/lesson-plans${qs ? `?${qs}` : ""}`);
}

/**
 * 6. Review a lesson plan (Headmaster / Director)
 */
export async function reviewLessonPlan(
  id: string,
  input: {
    status: "reviewed" | "needs_revision";
    reviewNotes?: string;
  },
): Promise<LessonPlanItem> {
  return apiClient.patch<LessonPlanItem>(`/lesson-plans/${id}/review`, input);
}

/**
 * 7. Delete a pending lesson plan
 */
export async function deleteLessonPlan(id: string): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(`/lesson-plans/${id}`);
}
