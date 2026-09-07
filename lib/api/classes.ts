import type { School } from "./schools";
import type { Subject } from "./subjects";
import { apiClient } from "./client";

export type ClassStatus = 'active' | 'archived';

export interface ClassTeacherSummary {
  id: string;
  fullName: string;
  email: string;
  schoolId?: string | null;
}

export interface ClassSubjectAssignment {
  id: string;
  classId: string;
  subjectId: string;
  teacherId?: string | null;
  subject: Subject;
  teacher?: ClassTeacherSummary | null;
}

export interface ClassItem {
  id: string;
  name: string;
  gradeLevel: string;
  academicYear: string;
  status: ClassStatus;
  schoolId: string | null;
  school?: School | null;
  teacherId?: string | null;
  teacher?: ClassTeacherSummary | null;
  classSubjects?: ClassSubjectAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface QueryClassesParams {
  schoolId?: string;
  gradeLevel?: string;
  academicYear?: string;
}

export interface ClassesResponse {
  isSuccess: boolean;
  total: number;
  data: ClassItem[];
}

export async function fetchClasses(
  params: QueryClassesParams = {},
): Promise<ClassesResponse> {
  const query = new URLSearchParams();

  if (params.schoolId && params.schoolId !== "all" && params.schoolId !== "default") {
    query.append("schoolId", params.schoolId);
  }
  if (params.gradeLevel && params.gradeLevel !== "all" && params.gradeLevel !== "default") {
    query.append("gradeLevel", params.gradeLevel);
  }
  if (params.academicYear && params.academicYear !== "all" && params.academicYear !== "default") {
    query.append("academicYear", params.academicYear);
  }

  const queryString = query.toString();
  return apiClient.get<ClassesResponse>(`/classes${queryString ? `?${queryString}` : ""}`);
}

export async function fetchClassById(
  id: string,
): Promise<{ isSuccess: boolean; data: ClassItem }> {
  return apiClient.get<{ isSuccess: boolean; data: ClassItem }>(`/classes/${id}`);
}

export async function createClass(data: {
  name: string;
  gradeLevel: string;
  academicYear?: string;
  schoolId?: string;
  teacherId?: string;
}): Promise<{ isSuccess: boolean; message: string; data: ClassItem }> {
  return apiClient.post<{ isSuccess: boolean; message: string; data: ClassItem }>(
    "/classes",
    data,
  );
}

export async function assignClassToSchool(
  id: string,
  schoolId: string,
): Promise<{ isSuccess: boolean; message: string; data: ClassItem }> {
  return apiClient.patch<{ isSuccess: boolean; message: string; data: ClassItem }>(
    `/classes/${id}/school`,
    { schoolId },
  );
}

export async function updateClass(
  id: string,
  data: Partial<{
    name: string;
    gradeLevel: string;
    academicYear: string;
    status: ClassStatus;
    schoolId: string | null;
    teacherId: string | null;
  }>,
): Promise<{ isSuccess: boolean; message: string; data: ClassItem }> {
  return apiClient.patch<{ isSuccess: boolean; message: string; data: ClassItem }>(
    `/classes/${id}`,
    data,
  );
}

export async function fetchClassSubjects(
  classId: string,
): Promise<{ isSuccess: boolean; data: ClassSubjectAssignment[] }> {
  return apiClient.get<{ isSuccess: boolean; data: ClassSubjectAssignment[] }>(
    `/classes/${classId}/subjects`,
  );
}

export async function assignClassSubjectTeacher(
  classId: string,
  data: { subjectId: string; teacherId: string },
): Promise<{ isSuccess: boolean; message: string; data: ClassSubjectAssignment }> {
  return apiClient.post<{
    isSuccess: boolean;
    message: string;
    data: ClassSubjectAssignment;
  }>(`/classes/${classId}/subjects`, data);
}

export async function removeClassSubject(
  classId: string,
  subjectId: string,
): Promise<{ isSuccess: boolean; message: string }> {
  return apiClient.delete<{ isSuccess: boolean; message: string }>(
    `/classes/${classId}/subjects/${subjectId}`,
  );
}
