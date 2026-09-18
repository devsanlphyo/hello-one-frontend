"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CheckSquare,
  Filter,
  RotateCcw,
  Save,
  Search,
  Square,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  fetchStaffSchedules,
  saveStaffSchedule,
  type StaffScheduleItem,
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

export function StaffScheduleTab() {
  const [staff, setStaff] = useState<StaffScheduleItem[]>([]);
  const [schedules, setSchedules] = useState<Record<string, Set<number>>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchStaffSchedules();
      setStaff(data || []);

      const map: Record<string, Set<number>> = {};
      (data || []).forEach((s) => {
        map[s.id] = new Set(s.daysOfWeek || []);
      });
      setSchedules(map);
    } catch (err: any) {
      toast.error(err.message || "Failed to load staff schedules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleDay(userId: string, dayOfWeek: number) {
    setSchedules((prev) => {
      const current = new Set(prev[userId] || []);
      if (current.has(dayOfWeek)) {
        current.delete(dayOfWeek);
      } else {
        current.add(dayOfWeek);
      }
      return { ...prev, [userId]: current };
    });
  }

  function setPreset(userId: string, preset: "weekdays" | "all" | "clear") {
    setSchedules((prev) => {
      let nextSet: Set<number>;
      if (preset === "weekdays") nextSet = new Set([1, 2, 3, 4, 5]);
      else if (preset === "all") nextSet = new Set([1, 2, 3, 4, 5, 6, 7]);
      else nextSet = new Set();
      return { ...prev, [userId]: nextSet };
    });
  }

  async function handleSaveStaffSchedule(userId: string, userName: string) {
    setSavingId(userId);
    try {
      const activeDays = Array.from(schedules[userId] || []);
      await saveStaffSchedule({
        userId,
        daysOfWeek: activeDays,
      });

      setSavedSuccessId(userId);
      toast.success(`Working days saved for ${userName}`);
      setTimeout(() => setSavedSuccessId(null), 2500);
    } catch (err: any) {
      toast.error(err.message || `Failed to save working days for ${userName}`);
    } finally {
      setSavingId(null);
    }
  }

  const filteredStaff = staff.filter((s) => {
    if (roleFilter !== "all" && s.role !== roleFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.school?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-500" />
            Staff Assigned Working Days (Assistants & Officers)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Designate the weekly working days for administrative officers and assistants. Staff can only clock in on assigned days.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-8 text-xs rounded-md border border-input bg-background px-2.5 font-medium outline-none"
          >
            <option value="all">All Roles ({staff.length})</option>
            <option value="assistant">Assistants Only</option>
            <option value="officer">Officers Only</option>
          </select>

          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search staff name..."
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

      {/* Staff Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-64 font-semibold text-xs">Staff Member</TableHead>
                {DAYS.map((d) => (
                  <TableHead
                    key={d.id}
                    className={`text-center font-semibold text-xs px-2 min-w-[100px] ${
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
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground text-xs">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No staff members found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((s) => {
                  const userDays = schedules[s.id] || new Set();
                  const isSaving = savingId === s.id;
                  const isSaved = savedSuccessId === s.id;

                  return (
                    <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                      {/* Staff Member Details */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 text-xs font-bold border">
                            <AvatarFallback className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {s.fullName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-xs truncate">{s.fullName}</span>
                              <Badge
                                variant={s.role === "officer" ? "default" : "secondary"}
                                className="text-[9px] uppercase tracking-wider px-1 py-0 h-4 font-semibold"
                              >
                                {s.role}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">{s.email}</div>
                            {s.school && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 mt-0.5 font-normal">
                                {s.school.name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-2 mt-2 pt-1 border-t text-[10px] text-muted-foreground">
                          <span>Presets:</span>
                          <button
                            type="button"
                            onClick={() => setPreset(s.id, "weekdays")}
                            className="hover:text-indigo-600 hover:underline font-medium"
                          >
                            Mon–Fri
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreset(s.id, "all")}
                            className="hover:text-indigo-600 hover:underline font-medium"
                          >
                            All Days
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreset(s.id, "clear")}
                            className="hover:text-rose-500 hover:underline text-rose-500/80"
                          >
                            Clear
                          </button>
                        </div>
                      </TableCell>

                      {/* 7 Days Toggle Buttons */}
                      {DAYS.map((d) => {
                        const isAssigned = userDays.has(d.id);

                        return (
                          <TableCell
                            key={d.id}
                            className={`p-2 text-center align-middle ${
                              d.id > 5 ? "bg-muted/20" : ""
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleDay(s.id, d.id)}
                              className={`w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                isAssigned
                                  ? "bg-indigo-600/15 border-indigo-500 text-indigo-600 dark:text-indigo-300 shadow-xs"
                                  : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                              }`}
                            >
                              {isAssigned ? (
                                <CheckSquare className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <Square className="h-3.5 w-3.5 opacity-60" />
                              )}
                              <span>{isAssigned ? "Assigned" : "Off"}</span>
                            </button>
                          </TableCell>
                        );
                      })}

                      {/* Action */}
                      <TableCell className="py-3 text-right">
                        <Button
                          size="sm"
                          variant={isSaved ? "default" : "outline"}
                          disabled={isSaving}
                          onClick={() => handleSaveStaffSchedule(s.id, s.fullName)}
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
