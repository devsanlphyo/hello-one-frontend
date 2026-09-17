"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Filter,
  MoreHorizontal,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  deleteShift,
  fetchShifts,
  fetchTeachersWithShifts,
  unassignTeacherShift,
  updateShift,
  type ShiftItem,
  type TeacherWithShift,
} from "@/lib/api/shifts";
import { fetchSchools, type School } from "@/lib/api/schools";
import { CreateShiftDialog } from "./components/CreateShiftDialog";
import { EditShiftDialog } from "./components/EditShiftDialog";
import { AssignFacultyShiftDialog } from "./components/AssignFacultyShiftDialog";

const shiftColorMap: Record<
  string,
  { bg: string; text: string; border: string; badge: string }
> = {
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800/60",
    badge: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/60 dark:text-sky-200 dark:border-sky-700",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
    badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800/60",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-200 dark:border-indigo-700",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
    badge: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-700",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/60",
    badge: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-700",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/60",
    badge: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700",
  },
};

function calculateDuration(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return "—";
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  if (isNaN(startH) || isNaN(endH)) return "—";

  let startMin = startH * 60 + (startM || 0);
  let endMin = endH * 60 + (endM || 0);
  if (endMin < startMin) {
    endMin += 24 * 60;
  }
  const diff = endMin - startMin;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (mins === 0) return `${hours} hrs`;
  return `${hours}h ${mins}m`;
}

function formatTime12h(timeStr: string): string {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, "0")}:${(m || 0).toString().padStart(2, "0")} ${period}`;
}

export default function ShiftsPage() {
  const [activeTab, setActiveTab] = useState<"schedules" | "faculty">("schedules");
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherWithShift[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States for Faculty tab
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("all");
  const [selectedShiftFilter, setSelectedShiftFilter] = useState("all");

  // Dialog States
  const [editingShift, setEditingShift] = useState<ShiftItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [assigningTeacher, setAssigningTeacher] = useState<TeacherWithShift | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const [deletingShift, setDeletingShift] = useState<ShiftItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [shiftsData, teachersData, schoolsRes] = await Promise.all([
        fetchShifts(),
        fetchTeachersWithShifts(),
        fetchSchools().catch(() => ({ isSuccess: false, data: [] })),
      ]);

      setShifts(shiftsData || []);
      setTeachers(teachersData || []);
      if (schoolsRes.isSuccess && schoolsRes.data) {
        setSchools(schoolsRes.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load shift information");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Quick toggle shift active state
  const handleToggleShiftActive = async (shift: ShiftItem) => {
    try {
      await updateShift(shift.id, { isActive: !shift.isActive });
      toast.success(
        `Shift "${shift.name}" is now ${!shift.isActive ? "active" : "inactive"}`,
      );
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update shift status");
    }
  };

  // Delete shift
  const handleDeleteShift = async () => {
    if (!deletingShift) return;
    setDeleteLoading(true);
    try {
      const res = await deleteShift(deletingShift.id);
      toast.success(res.message || `Shift "${deletingShift.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setDeletingShift(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Cannot delete shift");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Unassign faculty
  const handleUnassignTeacher = async (teacher: TeacherWithShift) => {
    try {
      await unassignTeacherShift(teacher.id);
      toast.success(`Unassigned ${teacher.fullName} from shift`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to unassign shift");
    }
  };

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = t.fullName.toLowerCase().includes(query);
        const matchesEmail = t.email.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      // School filter
      if (selectedSchoolId !== "all") {
        if (selectedSchoolId === "unassigned") {
          if (t.school) return false;
        } else if (t.school?.id !== selectedSchoolId) {
          return false;
        }
      }

      // Shift filter
      if (selectedShiftFilter !== "all") {
        if (selectedShiftFilter === "unassigned") {
          if (t.assignment) return false;
        } else {
          if (t.assignment?.shiftId !== selectedShiftFilter) return false;
        }
      }

      return true;
    });
  }, [teachers, searchQuery, selectedSchoolId, selectedShiftFilter]);

  // Metrics Calculations
  const activeShiftsCount = shifts.filter((s) => s.isActive).length;
  const assignedFacultyCount = teachers.filter((t) => t.assignment !== null).length;
  const unassignedFacultyCount = teachers.filter((t) => t.assignment === null).length;

  const operatingSpan = useMemo(() => {
    if (shifts.length === 0) return "Not configured";
    const sortedStarts = [...shifts].map((s) => s.startTime).sort();
    const sortedEnds = [...shifts].map((s) => s.endTime).sort();
    const earliest = sortedStarts[0];
    const latest = sortedEnds[sortedEnds.length - 1];
    return `${formatTime12h(earliest)} — ${formatTime12h(latest)}`;
  }, [shifts]);

  return (
    <SidebarProvider>
      <AdminSidebar current="shifts" />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Top Bar / Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
            <div className="space-y-1">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/admin/users">Admin</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbPage className="font-semibold text-foreground">
                    Shift Management
                  </BreadcrumbPage>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Shift Management
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Configure institutional work shifts and manage faculty duty allocations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="h-8 gap-1.5 text-xs"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <CreateShiftDialog onSuccess={loadData} />
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="border shadow-xs bg-card/60 backdrop-blur-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Configured Shifts
                </CardTitle>
                <div className="size-7 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{shifts.length}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                    {activeShiftsCount} active
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Master shifts defined in catalog
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs bg-card/60 backdrop-blur-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Faculty Allocated
                </CardTitle>
                <div className="size-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {assignedFacultyCount}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    of {teachers.length} total
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Teachers assigned active shifts
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs bg-card/60 backdrop-blur-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Unassigned Faculty
                </CardTitle>
                <div className="size-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <UserX className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span
                    className={`text-2xl font-bold ${
                      unassignedFacultyCount > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-foreground"
                    }`}
                  >
                    {unassignedFacultyCount}
                  </span>
                  {unassignedFacultyCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                    >
                      Action needed
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Teachers awaiting shift roster
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs bg-card/60 backdrop-blur-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Institutional Hours
                </CardTitle>
                <div className="size-7 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold truncate text-foreground">
                  {operatingSpan}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Daily campus operating window
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b pb-1">
            <button
              onClick={() => setActiveTab("schedules")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === "schedules"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Shift Schedules ({shifts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("faculty")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === "faculty"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Faculty Shift Allocation ({teachers.length})</span>
            </button>
          </div>

          {/* TAB 1: SHIFT SCHEDULES MASTER CATALOG */}
          {activeTab === "schedules" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Institutional Shift Definitions
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Standard shift models available for teacher allocation across all campus departments.
                  </p>
                </div>
                <CreateShiftDialog onSuccess={loadData} />
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-48 rounded-xl border bg-card animate-pulse"
                    />
                  ))}
                </div>
              ) : shifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed bg-muted/20">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold">No Shifts Configured</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                    Get started by creating institutional shift definitions for morning, noon, or evening hours.
                  </p>
                  <CreateShiftDialog onSuccess={loadData} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shifts.map((shift) => {
                    const theme =
                      shiftColorMap[shift.color] || shiftColorMap["sky"];
                    const duration = calculateDuration(shift.startTime, shift.endTime);

                    return (
                      <Card
                        key={shift.id}
                        className={`relative border transition-all duration-200 hover:shadow-md ${
                          !shift.isActive ? "opacity-75 bg-muted/30" : "bg-card"
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`size-2.5 rounded-full ${
                                    shift.color === "amber"
                                      ? "bg-amber-500"
                                      : shift.color === "emerald"
                                      ? "bg-emerald-500"
                                      : shift.color === "indigo"
                                      ? "bg-indigo-500"
                                      : shift.color === "rose"
                                      ? "bg-rose-500"
                                      : shift.color === "purple"
                                      ? "bg-purple-500"
                                      : "bg-sky-500"
                                  }`}
                                />
                                <CardTitle className="text-sm font-bold truncate">
                                  {shift.name}
                                </CardTitle>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 font-mono"
                              >
                                {shift.code}
                              </Badge>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-44 text-xs">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingShift(shift);
                                    setEditDialogOpen(true);
                                  }}
                                  className="gap-2 text-xs"
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>Edit Shift</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleShiftActive(shift)}
                                  className="gap-2 text-xs"
                                >
                                  <Power className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>
                                    {shift.isActive ? "Mark Inactive" : "Mark Active"}
                                  </span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDeletingShift(shift);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="gap-2 text-xs text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete Shift</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <CardDescription className="text-xs line-clamp-2 mt-2">
                            {shift.description || "Institutional faculty work shift schedule."}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3 pt-0">
                          {/* Timing Block */}
                          <div
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${theme.bg} ${theme.border}`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className={`h-4 w-4 ${theme.text}`} />
                              <span className="font-semibold text-foreground">
                                {formatTime12h(shift.startTime)} —{" "}
                                {formatTime12h(shift.endTime)}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-medium bg-background/80"
                            >
                              {duration}
                            </Badge>
                          </div>

                          {/* Footer Info & Quick Stats */}
                          <div className="flex items-center justify-between pt-1 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              <span>
                                <strong className="text-foreground">
                                  {shift.assignedCount || 0}
                                </strong>{" "}
                                faculty assigned
                              </span>
                            </div>
                            <Badge
                              className={`text-[10px] px-2 py-0.5 border ${
                                shift.isActive
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {shift.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FACULTY SHIFT ALLOCATION ROSTER */}
          {activeTab === "faculty" && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border">
                <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search teacher by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs w-full"
                    />
                  </div>

                  <div className="w-full sm:w-48">
                    <Select
                      items={[
                        { value: "all", label: "All Campuses / Schools" },
                        ...schools.map((s) => ({
                          value: s.id,
                          label: s.name,
                        })),
                        { value: "unassigned", label: "No Campus Assigned" },
                      ]}
                      value={selectedSchoolId}
                      onValueChange={(val) => setSelectedSchoolId((val as string) || "all")}
                    >
                      <SelectTrigger size="sm" className="h-8 text-xs w-full">
                        <SelectValue placeholder="Campus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">
                          All Campuses / Schools
                        </SelectItem>
                        {schools.map((sch) => (
                          <SelectItem key={sch.id} value={sch.id} className="text-xs">
                            {sch.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="unassigned" className="text-xs">
                          No Campus Assigned
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-44">
                    <Select
                      items={[
                        { value: "all", label: "All Shifts" },
                        ...shifts.map((s) => ({
                          value: s.id,
                          label: s.name,
                        })),
                        { value: "unassigned", label: "Unassigned Faculty" },
                      ]}
                      value={selectedShiftFilter}
                      onValueChange={(val) => setSelectedShiftFilter((val as string) || "all")}
                    >
                      <SelectTrigger size="sm" className="h-8 text-xs w-full">
                        <SelectValue placeholder="Shift Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">
                          All Shift Types
                        </SelectItem>
                        {shifts.map((sh) => (
                          <SelectItem key={sh.id} value={sh.id} className="text-xs">
                            {sh.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="unassigned" className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          Unassigned Faculty
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AssignFacultyShiftDialog
                    shifts={shifts}
                    teachers={teachers}
                    onSuccess={loadData}
                  />
                </div>
              </div>

              {/* Faculty Table */}
              <div className="rounded-xl border bg-card overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Teacher</TableHead>
                      <TableHead className="text-xs font-semibold">Campus / School</TableHead>
                      <TableHead className="text-xs font-semibold">Assigned Shift</TableHead>
                      <TableHead className="text-xs font-semibold">Work Hours</TableHead>
                      <TableHead className="text-xs font-semibold">Semester / Notes</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [1, 2, 3, 4].map((i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6} className="h-14">
                            <div className="h-4 bg-muted/60 rounded animate-pulse w-3/4 mx-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredTeachers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-36 text-center text-xs text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Filter className="h-5 w-5 text-muted-foreground/60" />
                            <span>No faculty records matched the selected filters.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTeachers.map((teacher) => {
                        const assignment = teacher.assignment;
                        const shiftColor = assignment?.shiftColor || "sky";
                        const theme =
                          shiftColorMap[shiftColor] || shiftColorMap["sky"];

                        return (
                          <TableRow key={teacher.id} className="hover:bg-muted/30">
                            {/* Teacher Info */}
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="size-8 border">
                                  <AvatarImage
                                    src={teacher.avatarUrl || undefined}
                                    alt={teacher.fullName}
                                  />
                                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                                    {teacher.fullName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex flex-col">
                                  <span className="font-semibold text-xs text-foreground truncate">
                                    {teacher.fullName}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground truncate">
                                    {teacher.email}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Campus Info */}
                            <TableCell className="py-3">
                              {teacher.school ? (
                                <div className="flex items-center gap-1.5 text-xs text-foreground">
                                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="truncate max-w-[160px]">
                                    {teacher.school.name}
                                  </span>
                                </div>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] text-muted-foreground font-normal"
                                >
                                  Unassigned Campus
                                </Badge>
                              )}
                            </TableCell>

                            {/* Shift Badge */}
                            <TableCell className="py-3">
                              {assignment ? (
                                <div className="flex items-center gap-1.5">
                                  <Badge
                                    className={`text-[11px] font-medium px-2 py-0.5 border ${theme.badge}`}
                                  >
                                    {assignment.shiftName}
                                  </Badge>
                                </div>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-amber-600 border-amber-300 dark:border-amber-700 dark:text-amber-400 font-normal"
                                >
                                  No Shift Assigned
                                </Badge>
                              )}
                            </TableCell>

                            {/* Work Hours */}
                            <TableCell className="py-3 text-xs">
                              {assignment ? (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                  <span>
                                    {formatTime12h(assignment.startTime)} —{" "}
                                    {formatTime12h(assignment.endTime)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>

                            {/* Semester / Notes */}
                            <TableCell className="py-3 text-xs max-w-[180px]">
                              {assignment ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-[11px] text-foreground truncate">
                                    {assignment.semester}
                                  </span>
                                  {assignment.notes && (
                                    <span className="text-[10px] text-muted-foreground truncate">
                                      {assignment.notes}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setAssigningTeacher(teacher);
                                    setAssignDialogOpen(true);
                                  }}
                                  className="h-7 px-2 text-[11px] gap-1"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>{assignment ? "Reassign" : "Assign"}</span>
                                </Button>

                                {assignment && (
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handleUnassignTeacher(teacher)}
                                    title="Unassign shift"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  >
                                    <UserX className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Edit Shift Modal Dialog */}
        <EditShiftDialog
          shift={editingShift}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={loadData}
        />

        {/* Individual Teacher Shift Assignment Dialog */}
        <AssignFacultyShiftDialog
          shifts={shifts}
          teachers={teachers}
          selectedTeacher={assigningTeacher}
          open={assignDialogOpen}
          onOpenChange={(open) => {
            setAssignDialogOpen(open);
            if (!open) setAssigningTeacher(null);
          }}
          onSuccess={loadData}
        />

        {/* Delete Shift Safety Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-1">
                <AlertCircle className="h-5 w-5" />
              </div>
              <DialogTitle>Delete Shift Schedule</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete shift schedule{" "}
                <strong>&quot;{deletingShift?.name}&quot;</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {deletingShift && deletingShift.assignedCount > 0 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Warning: There are currently <strong>{deletingShift.assignedCount}</strong> faculty member(s) assigned to this shift. You must reassign or unassign them first before deleting.
                </span>
              </div>
            )}

            <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteShift}
                disabled={deleteLoading || (deletingShift?.assignedCount || 0) > 0}
                className="w-full sm:w-auto"
              >
                {deleteLoading ? "Deleting..." : "Delete Shift"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
