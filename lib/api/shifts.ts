export interface ShiftItem {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  description: string;
  color: string;
  graceMinutes: number;
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

export interface TeacherMatrixScheduleSlot {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  color: string;
}

export interface TeacherScheduleMatrixItem {
  id: string;
  fullName: string;
  email: string;
  status: string;
  school?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  schedules: Record<number, TeacherMatrixScheduleSlot | null>;
}

export interface StaffScheduleItem {
  id: string;
  fullName: string;
  email: string;
  role: 'assistant' | 'officer';
  status: string;
  school?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  daysOfWeek: number[]; // 1=Mon .. 7=Sun
}

export interface CalendarDayItem {
  date: string;
  isSchoolDay: boolean;
  reason: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarStatusResponse {
  date: string;
  isSchoolDay: boolean;
  reason: string | null;
  isCustom: boolean;
}

export interface CreateShiftDto {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  description?: string;
  color?: string;
  graceMinutes?: number;
}

export interface UpdateShiftDefinitionDto {
  name?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  color?: string;
  graceMinutes?: number;
  isActive?: boolean;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffAvatar: string | null;
  teacherId?: string;
  teacherName?: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  createdAt?: string;
  updatedAt?: string;
  duration: string | null;
  status: 'on_time' | 'late' | 'in_progress' | 'completed' | 'absent';
  notes: string | null;
}

export interface TodayAttendanceStatus {
  date: string;
  dayOfWeek: number;
  isSchoolDay: boolean;
  calendarReason: string | null;
  isScheduledToday: boolean;
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
    graceMinutes?: number;
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
    createdAt?: string;
    updatedAt?: string;
    duration: string | null;
    status: 'on_time' | 'late' | 'in_progress' | 'completed' | 'absent';
    notes: string | null;
    shiftName?: string | null;
  } | null;
}

export interface AttendanceMonitorSummary {
  alreadyCheckedCount: number;
  notCheckedCount: number;
  onLeaveCount: number;
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
  status: 'checked_out' | 'checked_in' | 'late' | 'not_checked_in' | 'on_leave';
  checkInTime: string | null;
  checkOutTime: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  duration: string | null;
  notes: string | null;
}

export interface AttendanceMonitorResponse {
  date: string;
  summary: AttendanceMonitorSummary;
  records: AttendanceMonitorItem[];
}

// ── SHIFT DEFINITIONS ──

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

// ── 7-DAY TEACHER SHIFT MATRIX ──

export async function fetchTeacherScheduleMatrix(): Promise<TeacherScheduleMatrixItem[]> {
  const res = await fetch('/api/proxy/shifts/schedules/teachers', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to load teacher schedule matrix');
  }
  return res.json();
}

export async function saveTeacherSchedule(data: {
  userId: string;
  schedules: Array<{ dayOfWeek: number; shiftId: string | null }>;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/proxy/shifts/schedules/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to save teacher schedule');
  }
  return res.json();
}

// ── STAFF WORKING DAYS (ASSISTANTS & OFFICERS) ──

export async function fetchStaffSchedules(): Promise<StaffScheduleItem[]> {
  const res = await fetch('/api/proxy/shifts/schedules/staff', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to load staff working day schedules');
  }
  return res.json();
}

export async function saveStaffSchedule(data: {
  userId: string;
  daysOfWeek: number[];
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/proxy/shifts/schedules/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to save staff schedule');
  }
  return res.json();
}

// ── SCHOOL CALENDAR DAY CONTROLS ──

export async function fetchCalendarDays(): Promise<CalendarDayItem[]> {
  const res = await fetch('/api/proxy/shifts/calendar', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to load school calendar');
  }
  return res.json();
}

export async function fetchCalendarDayStatus(date?: string): Promise<CalendarStatusResponse> {
  const url = date
    ? `/api/proxy/shifts/calendar/status?date=${encodeURIComponent(date)}`
    : '/api/proxy/shifts/calendar/status';
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to load date status');
  }
  return res.json();
}

export async function saveCalendarOverride(data: {
  date: string;
  isSchoolDay: boolean;
  reason?: string;
}): Promise<CalendarDayItem> {
  const res = await fetch('/api/proxy/shifts/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to save calendar day override');
  }
  return res.json();
}

export async function deleteCalendarOverride(
  date: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/proxy/shifts/calendar/${date}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to remove calendar override');
  }
  return res.json();
}

// ── LEGACY ASSIGNMENTS ──

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
  staffId?: string,
): Promise<AttendanceRecord[]> {
  const url = staffId
    ? `/api/proxy/shifts/attendance?staffId=${encodeURIComponent(staffId)}`
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
