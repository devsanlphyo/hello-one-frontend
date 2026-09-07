import { apiClient } from "./client";

export type SubjectStatus = 'active' | 'archived';

export interface Subject {
  id: string;
  name: string;
  code: string;
  status: SubjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectsResponse {
  isSuccess: boolean;
  total: number;
  data: Subject[];
}

export async function fetchSubjects(): Promise<SubjectsResponse> {
  return apiClient.get<SubjectsResponse>("/subjects");
}

export async function fetchSubjectById(
  id: string,
): Promise<{ isSuccess: boolean; data: Subject }> {
  return apiClient.get<{ isSuccess: boolean; data: Subject }>(`/subjects/${id}`);
}

export async function createSubject(data: {
  name: string;
  code: string;
}): Promise<{ isSuccess: boolean; message: string; data: Subject }> {
  return apiClient.post<{ isSuccess: boolean; message: string; data: Subject }>(
    "/subjects",
    data,
  );
}

export async function updateSubject(
  id: string,
  data: Partial<{
    name: string;
    code: string;
    status: SubjectStatus;
  }>,
): Promise<{ isSuccess: boolean; message: string; data: Subject }> {
  return apiClient.patch<{ isSuccess: boolean; message: string; data: Subject }>(
    `/subjects/${id}`,
    data,
  );
}
