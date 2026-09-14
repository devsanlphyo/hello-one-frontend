"use client";

import {
  Building2,
  CalendarCheck,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { fetchSchools, type School } from "@/lib/api/schools";
import {
  type AttendanceMonitorResponse,
  fetchAttendanceMonitor,
} from "@/lib/api/shifts";

interface MonitorAttendanceViewProps {
  initialSchoolId?: string;
  allowCrossCampus?: boolean;
}

export function MonitorAttendanceView({
  initialSchoolId,
  allowCrossCampus = false,
}: MonitorAttendanceViewProps) {
  const { user } = useAuth();

  // Helper for today's local date string YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(getTodayStr());
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    initialSchoolId || (user?.schoolId ?? ""),
  );
  const [schools, setSchools] = useState<School[]>([]);

  const [data, setData] = useState<AttendanceMonitorResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  // Load schools list if user is director or admin
  useEffect(() => {
    if (allowCrossCampus) {
      fetchSchools()
        .then((res) => {
          if (res?.isSuccess && res.data) {
            setSchools(res.data);
          }
        })
        .catch(() => {});
    }
  }, [allowCrossCampus]);

  // Fetch monitoring data
  const loadData = useCallback(() => {
    startTransition(async () => {
      setLoading(true);
      try {
        const res = await fetchAttendanceMonitor({
          date,
          status,
          search: search.trim() || undefined,
          schoolId: selectedSchoolId || undefined,
        });
        setData(res);
      } catch (err: any) {
        toast.error(err.message || "Failed to load attendance monitoring data");
      } finally {
        setLoading(false);
      }
    });
  }, [date, status, search, selectedSchoolId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format nice date label for display e.g. "Today (Apr 24, 2025)"
  const getDateDisplay = (dateStr: string) => {
    const isToday = dateStr === getTodayStr();
    const formatted = new Date(`${dateStr}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );
    return isToday ? `Today (${formatted})` : formatted;
  };

  const records = data?.records || [];
  const summary = data?.summary || {
    alreadyCheckedCount: 0,
    notCheckedCount: 0,
    totalCount: 0,
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ── HEADER (Matching Image 2) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Monitor Attendances
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track and manage teacher attendance and check-in/check-out
            activities in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {allowCrossCampus && (
            <Badge
              variant="outline"
              className="text-xs font-medium border-purple-500/30 text-purple-600 bg-purple-500/5"
            >
              Multi-Campus View
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading || isPending}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── 2 KPI METRIC SUMMARY CARDS (Matching Image 2) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Already CheckIn/CheckOut */}
        <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-xs transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-foreground">
                  Already CheckIn/CheckOut
                </h3>
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {summary.alreadyCheckedCount}
                </div>
              </div>
              <div className="h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600">
                <Users className="h-3.5 w-3.5" />
                Teachers present
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Not CheckIn/CheckOut Yet */}
        <Card className="border-rose-500/20 bg-rose-500/5 shadow-xs transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-foreground">
                  Not CheckIn/CheckOut Yet
                </h3>
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {summary.notCheckedCount}
                </div>
              </div>
              <div className="h-9 w-9 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-600 shrink-0">
                <X className="h-5 w-5 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-rose-500/15 text-rose-600">
                <Users className="h-3.5 w-3.5" />
                Teachers pending
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── FILTER ROW (Matching Image 2) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Status Filter */}
        <div className="p-2.5 rounded-xl border bg-card shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Filter by status</span>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full text-xs font-medium bg-transparent border-0 focus:ring-0 p-0 text-foreground cursor-pointer outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="checked_out">Checked Out</option>
            <option value="checked_in">Checked In</option>
            <option value="not_checked_in">Not Checked In Yet</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="p-2.5 rounded-xl border bg-card shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            <span>Filter by Date</span>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-xs font-medium bg-transparent border-0 focus:ring-0 p-0 text-foreground cursor-pointer outline-hidden"
          />
        </div>

        {/* School Campus Filter (For Director / Multi-Campus) */}
        {allowCrossCampus && (
          <div className="p-2.5 rounded-xl border bg-card shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Campus / Branch</span>
            </div>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full text-xs font-medium bg-transparent border-0 focus:ring-0 p-0 text-foreground cursor-pointer outline-hidden"
            >
              <option value="">All Campuses</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search Input */}
        <div
          className={`p-2.5 rounded-xl border bg-card shadow-2xs space-y-1 ${!allowCrossCampus ? "sm:col-span-2" : ""}`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Search className="h-3.5 w-3.5 text-primary" />
            <span>Search Teacher</span>
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-0 focus:ring-0 p-0 outline-hidden placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* ── ATTENDANCES TABLE (Matching Image 2) ── */}
      <div className="rounded-xl border shadow-xs overflow-hidden bg-card">
        {/* Navy Themed Banner Header */}
        <div className="bg-[#1e3a5f] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-300" />
            <h3 className="font-bold text-xs tracking-wide">
              Attendances Table
            </h3>
          </div>
          <span className="text-[11px] text-sky-200/80">
            {getDateDisplay(date)} &bull; {records.length} Staff Listed
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                <th className="py-3 px-3.5 text-center w-12">#</th>
                <th className="py-3 px-4">Teacher Name</th>
                <th className="py-3 px-4">Shift Time</th>
                <th className="py-3 px-4 text-center">Checkin/Out Status</th>
                <th className="py-3 px-4 text-center">Checkin Time</th>
                <th className="py-3 px-4 text-center">Checkout Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {records.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  {/* # */}
                  <td className="py-3.5 px-3.5 text-center text-muted-foreground font-mono font-medium">
                    {item.rowNumber || idx + 1}
                  </td>

                  {/* Teacher Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
                        {item.teacherName ? item.teacherName.charAt(0) : "T"}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-foreground block truncate">
                          {item.teacherName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                          <span>{item.teacherEmail}</span>
                          {allowCrossCampus && (
                            <>
                              <span>&bull;</span>
                              <span className="text-primary font-medium">
                                {item.schoolName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Shift Time */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{item.shiftTime}</span>
                    </div>
                  </td>

                  {/* Status Badge (Matching Image 2) */}
                  <td className="py-3.5 px-4 text-center">
                    {item.status === "checked_out" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        Checked Out
                      </span>
                    ) : item.status === "checked_in" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-teal-500/15 text-teal-700 border border-teal-500/20">
                        <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        Checked In
                      </span>
                    ) : item.status === "late" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 border border-amber-500/20">
                        <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        Late Arrival
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        <X className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        Not Checked In
                      </span>
                    )}
                  </td>

                  {/* Checkin Time */}
                  <td className="py-3.5 px-4 text-center font-mono font-medium text-foreground">
                    {item.checkInTime || "—"}
                  </td>

                  {/* Checkout Time */}
                  <td className="py-3.5 px-4 text-center font-mono font-medium text-foreground">
                    {item.checkOutTime || "—"}
                  </td>
                </tr>
              ))}

              {records.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-xs text-muted-foreground"
                  >
                    No attendance records found matching your filters for{" "}
                    {getDateDisplay(date)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
