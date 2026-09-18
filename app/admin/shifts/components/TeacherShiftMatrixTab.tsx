"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  RotateCcw,
  Save,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  fetchShifts,
  fetchTeacherScheduleMatrix,
  saveTeacherSchedule,
  type ShiftItem,
  type TeacherScheduleMatrixItem,
} from "@/lib/api/shifts";

const DAYS = [
  { id: 1, label: "Mon", full: "Monday" },
  { id: 2, label: "Tue", full: "Tuesday" },
  { id: 3, label: "Wed", full: "Wednesday" },
  { id: 4, label: "Thu", full: "Thursday" },
  { id: 5, label: "Fri", full: "Friday" },
  { id: 6, label: "Sat", full: "Saturday" },
  { id: 7, label: "Sun", full: "Sunday" },
];

export function TeacherShiftMatrixTab() {
  const [teachers, setTeachers] = useState<TeacherScheduleMatrixItem[]>([]);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [schedules, setSchedules] = useState<Record<string, Record<number, string>>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [matrixRes, shiftsRes] = await Promise.all([
        fetchTeacherScheduleMatrix(),
        fetchShifts(),
      ]);
      setTeachers(matrixRes || []);
      setShifts(shiftsRes || []);

      // Build local schedules map { [teacherId]: { [dayOfWeek]: shiftId } }
      const map: Record<string, Record<number, string>> = {};
      (matrixRes || []).forEach((t) => {
        map[t.id] = {};
        DAYS.forEach((d) => {
          map[t.id][d.id] = t.schedules?.[d.id]?.shiftId || "";
        });
      });
      setSchedules(map);
    } catch (err: any) {
      toast.error(err.message || "Failed to load teacher schedules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleShiftChange(teacherId: string, dayOfWeek: number, shiftId: string) {
    setSchedules((prev) => ({
      ...prev,
      [teacherId]: {
        ...(prev[teacherId] || {}),
        [dayOfWeek]: shiftId,
      },
    }));
  }

  function handleApplyPreset(teacherId: string, shiftId: string, weekdaysOnly = true) {
    setSchedules((prev) => {
      const updated = { ...(prev[teacherId] || {}) };
      DAYS.forEach((d) => {
        if (weekdaysOnly) {
          if (d.id <= 5) updated[d.id] = shiftId;
          else updated[d.id] = "";
        } else {
          updated[d.id] = shiftId;
        }
      });
      return { ...prev, [teacherId]: updated };
    });
  }

  async function handleSaveTeacherSchedule(teacherId: string, teacherName: string) {
    setSavingId(teacherId);
    try {
      const teacherSched = schedules[teacherId] || {};
      const payload = DAYS.map((d) => ({
        dayOfWeek: d.id,
        shiftId: teacherSched[d.id] || null,
      }));

      await saveTeacherSchedule({
        userId: teacherId,
        schedules: payload,
      });

      setSavedSuccessId(teacherId);
      toast.success(`Schedule saved for ${teacherName}`);
      setTimeout(() => setSavedSuccessId(null), 2500);
    } catch (err: any) {
      toast.error(err.message || `Failed to save schedule for ${teacherName}`);
    } finally {
      setSavingId(null);
    }
  }

  const filteredTeachers = teachers.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.fullName.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.school?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Teacher 7-Day Shift Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure designated daily teaching shifts (Mon–Sun). Teachers can only clock in on days with assigned shifts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search teacher or school..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-8 text-xs gap-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Matrix Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-64 font-semibold text-xs">Faculty Member</TableHead>
                {DAYS.map((d) => (
                  <TableHead
                    key={d.id}
                    className={`text-center font-semibold text-xs px-2 min-w-[130px] ${
                      d.id > 5 ? "bg-muted/80 text-muted-foreground" : ""
                    }`}
                  >
                    <div>{d.label}</div>
                    <div className="text-[10px] font-normal opacity-70">
                      {d.id > 5 ? "Weekend" : "Weekday"}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-right font-semibold text-xs w-28">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9} className="py-6 text-center text-xs text-muted-foreground">
                      <div className="h-6 bg-muted animate-pulse rounded max-w-lg mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground text-xs">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No teachers found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((t) => {
                  const userSched = schedules[t.id] || {};
                  const isSaving = savingId === t.id;
                  const isSaved = savedSuccessId === t.id;

                  return (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                      {/* Teacher Profile Cell */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 text-xs font-bold border">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {t.fullName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-xs truncate">{t.fullName}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{t.email}</div>
                            {t.school && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 mt-0.5 font-normal">
                                {t.school.name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Quick preset links */}
                        <div className="flex items-center gap-1.5 mt-2 pt-1 border-t text-[10px] text-muted-foreground">
                          <span>Presets:</span>
                          {shifts.slice(0, 2).map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleApplyPreset(t.id, s.id, true)}
                              className="hover:text-primary hover:underline font-medium"
                            >
                              {s.name.split(" ")[0]} (M-F)
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(t.id, "", false)}
                            className="hover:text-rose-500 hover:underline text-rose-500/80"
                          >
                            Clear
                          </button>
                        </div>
                      </TableCell>

                      {/* 7 Days Select Dropdowns */}
                      {DAYS.map((d) => {
                        const currentShiftId = userSched[d.id] || "";
                        const assignedShift = shifts.find((s) => s.id === currentShiftId);

                        return (
                          <TableCell
                            key={d.id}
                            className={`p-2 text-center align-middle ${
                              d.id > 5 ? "bg-muted/20" : ""
                            }`}
                          >
                            <select
                              value={currentShiftId}
                              onChange={(e) => handleShiftChange(t.id, d.id, e.target.value)}
                              className={`w-full text-[11px] rounded-lg px-2 py-1.5 font-medium border outline-none transition cursor-pointer ${
                                currentShiftId
                                  ? "bg-primary/10 border-primary/40 text-primary font-semibold shadow-xs"
                                  : "bg-background border-border text-muted-foreground hover:border-foreground/40"
                              }`}
                            >
                              <option value="">Off (No Shift)</option>
                              {shifts.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.startTime}–{s.endTime})
                                </option>
                              ))}
                            </select>

                            {assignedShift && (
                              <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                                {assignedShift.startTime}–{assignedShift.endTime}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}

                      {/* Actions */}
                      <TableCell className="py-3 text-right">
                        <Button
                          size="sm"
                          variant={isSaved ? "default" : "outline"}
                          disabled={isSaving}
                          onClick={() => handleSaveTeacherSchedule(t.id, t.fullName)}
                          className={`h-8 text-xs gap-1.5 transition-all ${
                            isSaved ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Save className="h-3.5 w-3.5" />
                              {isSaving ? "Saving..." : "Save"}
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
