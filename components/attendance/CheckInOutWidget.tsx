"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchTodayAttendanceStatus,
  performCheckIn,
  performCheckOut,
  type TodayAttendanceStatus,
} from "@/lib/api/shifts";

export function CheckInOutWidget() {
  const [data, setData] = useState<TodayAttendanceStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Load attendance status
  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchTodayAttendanceStatus();
      console.log("Today attendance status ", res);
      setData(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load attendance status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Real-time ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check-In handler
  const handleCheckIn = () => {
    startTransition(async () => {
      try {
        const updated = await performCheckIn();
        setData(updated);
        toast.success("Checked in successfully! Have a productive workday.");
      } catch (err: any) {
        toast.error(err.message || "Check-in failed");
      }
    });
  };

  // Check-Out handler
  const handleCheckOut = () => {
    startTransition(async () => {
      try {
        const updated = await performCheckOut();
        setData(updated);
        toast.success("Checked out successfully. Thank you for your work!");
      } catch (err: any) {
        toast.error(err.message || "Check-out failed");
      }
    });
  };

  // Format ISO timestamps into user browser's local time
  const formatLocalTime = (
    isoDate?: string | null,
    fallbackTime?: string | null,
  ): string => {
    if (isoDate) {
      try {
        const d = new Date(isoDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
      } catch {
        // use fallback
      }
    }
    return fallbackTime || "—";
  };

  // Greeting helper based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (loading && !data) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-8">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  const isCheckedIn = Boolean(data?.isCheckedIn);
  const isCheckedOut = Boolean(data?.isCheckedOut);
  const shift = data?.shift;
  const attendance = data?.attendance;
  const user = data?.user;

  const displayCheckInTime = formatLocalTime(
    attendance?.createdAt,
    attendance?.checkInTime,
  );
  const displayCheckOutTime = isCheckedOut
    ? formatLocalTime(attendance?.updatedAt, attendance?.checkOutTime)
    : "—";

  return (
    <div className="space-y-6 max-w-xl mx-auto animate-in fade-in-50 duration-200">
      {/* ── HEADER TITLE ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Check In / Check Out
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Mark your attendance by checking in and checking out at the right
            time.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={loadStatus}
          disabled={loading || isPending}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Refresh Status"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* ── MAIN HERO CARD (Matching Image 3) ── */}
      <Card className="shadow-xs border-emerald-500/20 bg-linear-to-b from-emerald-500/10 via-emerald-500/5 to-card/60 backdrop-blur-xs relative overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Top user badge & status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-xs">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>

            {/* Status Pill Badge */}
            {!data?.isSchoolDay ? (
              <Badge
                variant="outline"
                className="bg-rose-500/15 text-rose-700 border-rose-500/30 text-xs px-3 py-1 font-medium gap-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                School Closed ({data?.calendarReason || "Off-Day"})
              </Badge>
            ) : !data?.isScheduledToday && !isCheckedIn ? (
              <Badge
                variant="outline"
                className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-xs px-3 py-1 font-medium gap-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Not Scheduled Today
              </Badge>
            ) : isCheckedOut ? (
              <Badge
                variant="outline"
                className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-xs px-3 py-1 font-medium gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Shift Completed
              </Badge>
            ) : isCheckedIn ? (
              <Badge
                variant="outline"
                className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-xs px-3 py-1 font-medium gap-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Currently Checked In
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground border-border text-xs px-3 py-1 font-medium gap-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                Not Checked In Yet
              </Badge>
            )}
          </div>

          {/* Personalized Greeting */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {getGreeting()}, {user?.fullName || "Faculty Staff"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {!data?.isSchoolDay
                ? `Campus is officially closed today: ${data?.calendarReason || "School Holiday / Closure"}.`
                : !data?.isScheduledToday && !isCheckedIn
                ? "You do not have an assigned working shift or duty today."
                : isCheckedOut
                ? "You have completed your shift attendance for today."
                : isCheckedIn
                ? "You are checked in for today."
                : shift
                ? `Assigned Shift: ${shift.name} (${shift.formattedHours})`
                : "You are ready to check in for your workday."}
            </p>
          </div>

          {/* Time Highlight Box */}
          <div className="rounded-2xl border border-border/80 bg-card/90 shadow-2xs p-4 sm:p-5 text-center space-y-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
              {isCheckedIn ? "Check In Time" : "Current Time"}
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-mono">
              {isCheckedIn ? displayCheckInTime : currentTime || "08:00 AM"}
            </div>
            <span className="text-xs text-muted-foreground block pt-0.5">
              {attendance?.date
                ? new Date(`${attendance.date}T00:00:00`).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )
                : formattedDate}
            </span>
          </div>

          {/* Action Button */}
          <div>
            {!data?.isSchoolDay ? (
              <Button
                disabled
                className="w-full py-6 text-sm font-semibold rounded-xl bg-muted text-muted-foreground border cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                School Closed Today ({data?.calendarReason || "Off-Day"})
              </Button>
            ) : !data?.isScheduledToday && !isCheckedIn ? (
              <Button
                disabled
                className="w-full py-6 text-sm font-semibold rounded-xl bg-muted text-muted-foreground border cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Not Scheduled to Work Today
              </Button>
            ) : isCheckedOut ? (
              <Button
                disabled
                className="w-full py-6 text-sm font-semibold rounded-xl bg-muted text-muted-foreground border cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Completed for Today
              </Button>
            ) : isCheckedIn ? (
              <Button
                type="button"
                onClick={handleCheckOut}
                disabled={isPending}
                className="w-full py-6 text-sm font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/30 shadow-xs hover:border-rose-500/50 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <LogOut className="h-4 w-4 text-rose-600" />
                {isPending ? "Checking Out..." : "Check Out"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCheckIn}
                disabled={isPending || !data?.canCheckIn}
                className="w-full py-6 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                {isPending ? "Checking In..." : "Check In"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── TODAY'S ACTIVITY (Matching Image 3) ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="p-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-xs font-bold text-foreground">
              Today's Activity
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-2 gap-4">
          {/* Checked In Column */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${isCheckedIn ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
              />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Checked In
              </span>
            </div>
            <div className="text-lg font-bold text-foreground font-mono">
              {displayCheckInTime}
            </div>
            <span className="text-[11px] text-muted-foreground block">
              {isCheckedIn ? formattedDate : "Pending"}
            </span>
          </div>

          {/* Checked Out Column */}
          <div className="space-y-1 border-l pl-4">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${isCheckedOut ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
              />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Checked Out
              </span>
            </div>
            <div className="text-lg font-bold text-foreground font-mono">
              {displayCheckOutTime}
            </div>
            <span className="text-[11px] text-muted-foreground block">
              {isCheckedOut
                ? `Duration: ${attendance?.duration || "Completed"}`
                : "Pending"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
