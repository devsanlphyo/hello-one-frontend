import type { Subject } from "./subjects";
import { apiClient } from "./client";

export type SchoolStatus = 'active' | 'suspend';

export interface SchoolClassSummary {
  id: string;
  name: string;
  gradeLevel: string;
  academicYear: string;
  status: 'active' | 'archived';
}

export interface SchoolHeadmasterSummary {
  id: string;
  fullName: string;
  email: string;
}

export interface SchoolStaffSummary {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  schoolId: string | null;
}

export interface School {
  id: string;
  name: string;
  code: string;
  principalName?: string | null;
  headmasterId?: string | null;
  headmaster?: SchoolHeadmasterSummary | null;
  status: SchoolStatus;
  classes?: SchoolClassSummary[];
  classesCount?: number;
  subjects?: Subject[];
  subjectsCount?: number;
  /** Staff members (teachers, headmasters, etc.) linked to this school */
  staff?: SchoolStaffSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface SchoolsResponse {
  isSuccess: boolean;
  total: number;
  data: School[];
}

export async function fetchSchools(): Promise<SchoolsResponse> {
  return apiClient.get<SchoolsResponse>("/schools");
}

export async function fetchSchoolById(
  id: string,
): Promise<{ isSuccess: boolean; data: School }> {
  return apiClient.get<{ isSuccess: boolean; data: School }>(`/schools/${id}`);
}

export async function createSchool(data: {
  name: string;
  code: string;
  principalName?: string;
  headmasterId?: string;
}): Promise<{ isSuccess: boolean; message: string; data: School }> {
  return apiClient.post<{ isSuccess: boolean; message: string; data: School }>(
    "/schools",
    data,
  );
}

export async function updateSchool(
  id: string,
  data: Partial<{
    name: string;
    code: string;
    principalName?: string;
    headmasterId?: string | null;
    status: SchoolStatus;
  }>,
): Promise<{ isSuccess: boolean; message: string; data: School }> {
  return apiClient.patch<{ isSuccess: boolean; message: string; data: School }>(
    `/schools/${id}`,
    data,
  );
}

export async function fetchSchoolSubjects(
  schoolId: string,
): Promise<{ isSuccess: boolean; data: Subject[] }> {
  return apiClient.get<{ isSuccess: boolean; data: Subject[] }>(
    `/schools/${schoolId}/subjects`,
  );
}

export async function assignSchoolSubjects(
  schoolId: string,
  subjectIds: string[],
): Promise<{ isSuccess: boolean; message: string; data: Subject[] }> {
  return apiClient.post<{ isSuccess: boolean; message: string; data: Subject[] }>(
    `/schools/${schoolId}/subjects`,
    { subjectIds },
  );
}
