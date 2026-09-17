export interface ShiftItem {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  description: string;
  color: string;
  isActive: boolean;
  assignedCount: number;
}

export interface TeacherAssignment {
  id: string;
  shiftId: string;
  shiftName: string;
  shiftCode: string;
  startTime: string;
  endTime: string;
  shiftColor: string;
  semester: string;
  isPermanent: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface TeacherWithShift {
  id: string;
  fullName: string;
  email: string;
  status: string;
  avatarUrl?: string | null;
  school?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  assignment: TeacherAssignment | null;
}

export interface CreateShiftDto {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  description?: string;
  color?: string;
}

export interface UpdateShiftDefinitionDto {
  name?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface AttendanceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherAvatar: string | null;
  shiftId: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  shiftColor: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  duration: string | null;
  status: 'on_time' | 'late' | 'in_progress' | 'completed' | 'absent';
  notes: string | null;
}

export interface TodayAttendanceStatus {
  date: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    schoolName: string;
  };
  shift: {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    formattedHours: string;
    color: string;
  } | null;
  isWithinShift: boolean;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  canCheckIn: boolean;
  canCheckOut: boolean;
  attendance: {
    id: string;
    date: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    duration: string | null;
    status: 'on_time' | 'late' | 'in_progress' | 'completed' | 'absent';
    notes: string | null;
    shiftName?: string | null;
  } | null;
}

export interface AttendanceMonitorSummary {
  alreadyCheckedCount: number;
  notCheckedCount: number;
  totalCount: number;
}

export interface AttendanceMonitorItem {
  rowNumber: number;
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherAvatar?: string | null;
  teacherRole: string;
  schoolName: string;
  schoolId?: string | null;
  shiftName: string;
  shiftTime: string;
  shiftColor: string;
  status: 'checked_out' | 'checked_in' | 'late' | 'not_checked_in';
  checkInTime: string | null;
  checkOutTime: string | null;
  duration: string | null;
  notes: string | null;
}

export interface AttendanceMonitorResponse {
  date: string;
  summary: AttendanceMonitorSummary;
  records: AttendanceMonitorItem[];
}

export async function fetchShifts(): Promise<ShiftItem[]> {
  const res = await fetch('/api/proxy/shifts', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to load shifts');
  }
  return res.json();
}

export async function createShift(data: CreateShiftDto): Promise<ShiftItem> {
  const res = await fetch('/api/proxy/shifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create shift');
  }
  return res.json();
}

export async function updateShift(
  id: string,
  data: UpdateShiftDefinitionDto,
): Promise<ShiftItem> {
  const res = await fetch(`/api/proxy/shifts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update shift');
  }
  return res.json();
}

export async function deleteShift(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/proxy/shifts/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete shift');
  }
  return res.json();
}

export async function fetchTeachersWithShifts(): Promise<TeacherWithShift[]> {
  const res = await fetch('/api/proxy/shifts/teachers', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to load teachers');
  }
  return res.json();
}

export async function assignTeacherShift(data: {
  teacherId: string;
  shiftId: string;
  semester?: string;
  notes?: string;
}) {
  const res = await fetch('/api/proxy/shifts/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to assign teacher to shift');
  }
  return res.json();
}

export async function updateTeacherShift(
  assignmentId: string,
  data: {
    shiftId?: string;
    semester?: string;
    status?: 'active' | 'inactive';
    notes?: string;
  },
) {
  const res = await fetch(`/api/proxy/shifts/assign/${assignmentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update teacher shift');
  }
  return res.json();
}

export async function unassignTeacherShift(teacherId: string) {
  const res = await fetch(`/api/proxy/shifts/assign/${teacherId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete shift assignment');
  }
  return res.json();
}

export async function fetchShiftAttendance(
  teacherId?: string,
): Promise<AttendanceRecord[]> {
  const url = teacherId
    ? `/api/proxy/shifts/attendance?teacherId=${encodeURIComponent(teacherId)}`
    : '/api/proxy/shifts/attendance';
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to load shift attendance records');
  }
  return res.json();
}

// ── TODAY ATTENDANCE ACTIONS ──

export async function fetchTodayAttendanceStatus(): Promise<TodayAttendanceStatus> {
  const res = await fetch('/api/proxy/shifts/attendance/today', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch today attendance status');
  }
  return res.json();
}

export async function performCheckIn(
  notes?: string,
): Promise<TodayAttendanceStatus> {
  const res = await fetch('/api/proxy/shifts/attendance/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Check-in failed');
  }
  return res.json();
}

export async function performCheckOut(
  notes?: string,
): Promise<TodayAttendanceStatus> {
  const res = await fetch('/api/proxy/shifts/attendance/check-out', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Check-out failed');
  }
  return res.json();
}

// ── MONITORING DATA ──

export async function fetchAttendanceMonitor(params?: {
  date?: string;
  status?: string;
  schoolId?: string;
  search?: string;
}): Promise<AttendanceMonitorResponse> {
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.status) query.set('status', params.status);
  if (params?.schoolId) query.set('schoolId', params.schoolId);
  if (params?.search) query.set('search', params.search);

  const qs = query.toString();
  const url = `/api/proxy/shifts/attendance/monitor${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to load attendance monitoring data');
  }
  return res.json();
}
