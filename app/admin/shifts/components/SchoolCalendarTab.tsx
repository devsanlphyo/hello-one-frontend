"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  PlusCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deleteCalendarOverride,
  fetchCalendarDays,
  saveCalendarOverride,
  type CalendarDayItem,
} from "@/lib/api/shifts";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function SchoolCalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [exceptions, setExceptions] = useState<Record<string, CalendarDayItem>>({});
  const [loading, setLoading] = useState(true);

  // Selected date override form state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isSchoolDay, setIsSchoolDay] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchCalendarDays();
      const map: Record<string, CalendarDayItem> = {};
      (data || []).forEach((d) => {
        map[d.date] = d;
      });
      setExceptions(map);
    } catch (err: any) {
      toast.error(err.message || "Failed to load calendar days");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getDaysInMonth(y: number, m: number) {
    const firstDay = new Date(y, m, 1).getDay();
    const daysCount = new Date(y, m + 1, 0).getDate();
    // 0 = Sunday, 1 = Monday => convert to Mon = 0, ..., Sun = 6
    return { firstDay: firstDay === 0 ? 6 : firstDay - 1, daysCount };
  }

  const { firstDay, daysCount } = getDaysInMonth(year, month);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function formatDateStr(day: number): string {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  function handleSelectDay(day: number) {
    const dateStr = formatDateStr(day);
    setSelectedDate(dateStr);
    const existing = exceptions[dateStr];
    if (existing) {
      setIsSchoolDay(existing.isSchoolDay);
      setReason(existing.reason || "");
    } else {
      const d = new Date(dateStr + "T00:00:00").getDay();
      const isWeekday = d >= 1 && d <= 5;
      setIsSchoolDay(!isWeekday);
      setReason(!isWeekday ? "Makeup School Day" : "Unexpected Campus Closure");
    }
  }

  async function handleSaveException(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate) return;
    setSaving(true);
    try {
      await saveCalendarOverride({
        date: selectedDate,
        isSchoolDay,
        reason: reason.trim() || undefined,
      });
      toast.success(
        `Calendar override saved for ${selectedDate} (${isSchoolDay ? "School Open" : "School Closed"})`,
      );
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save calendar override");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteException() {
    if (!selectedDate || !exceptions[selectedDate]) return;
    setDeleting(true);
    try {
      await deleteCalendarOverride(selectedDate);
      toast.success(`Removed custom override for ${selectedDate}`);
      setReason("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove calendar override");
    } finally {
      setDeleting(false);
    }
  }

  const isSelectedDateOverridden = Boolean(selectedDate && exceptions[selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            School Academic Calendar Manager
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure institutional operating days, declare unexpected off-days (weather, holidays), or schedule weekend makeup days.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="h-8 text-xs gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Calendar View (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            {/* Month & Navigation */}
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="font-bold text-base text-foreground">
                {MONTH_NAMES[month]} {year}
              </h3>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevMonth}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="h-8 text-xs px-2.5"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted-foreground my-3">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div className="text-rose-600/70 dark:text-rose-400/70">Sat</div>
              <div className="text-rose-600/70 dark:text-rose-400/70">Sun</div>
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading padding */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="h-20 rounded-xl bg-muted/20 border border-dashed border-border/40"
                />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysCount }).map((_, i) => {
                const day = i + 1;
                const dateStr = formatDateStr(day);
                const dayOfWeek = new Date(dateStr + "T00:00:00").getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                const custom = exceptions[dateStr];
                const isSchool =
                  custom !== undefined ? custom.isSchoolDay : !isWeekend;
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-20 p-2 rounded-xl text-left border flex flex-col justify-between transition-all relative overflow-hidden group ${
                      isSelected
                        ? "ring-2 ring-primary border-primary bg-primary/10 shadow-xs"
                        : isSchool
                        ? "bg-card border-border hover:border-emerald-500/60 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20"
                        : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 hover:border-rose-500/60"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold ${
                          isWeekend ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {day}
                      </span>
                      {custom && (
                        <span
                          className="w-2 h-2 rounded-full bg-amber-500 shadow-xs shrink-0"
                          title="Custom Override"
                        />
                      )}
                    </div>

                    <div className="text-[10px] leading-tight w-full">
                      {isSchool ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle className="h-2.5 w-2.5" />
                          Open
                        </span>
                      ) : (
                        <span
                          className="text-rose-700 dark:text-rose-400 font-medium truncate block"
                          title={custom?.reason || (isWeekend ? "Weekend" : "Closed")}
                        >
                          {custom?.reason || (isWeekend ? "Weekend" : "Closed")}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-4 mt-4 border-t">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-card border border-border inline-block" />
                Regular School Day (Mon–Fri)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 inline-block" />
                School Closed / Off-Day
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Custom Configured Override
              </div>
            </div>
          </Card>
        </div>

        {/* Date Override Panel (1 Column) */}
        <div className="h-fit">
          <Card className="p-5 space-y-4">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                Override Date Status
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Select any date on the calendar to mark an unexpected off-day, holiday, emergency closure, or weekend makeup day.
              </CardDescription>
            </div>

            <form onSubmit={handleSaveException} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Selected Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    if (e.target.value) {
                      const existing = exceptions[e.target.value];
                      if (existing) {
                        setIsSchoolDay(existing.isSchoolDay);
                        setReason(existing.reason || "");
                      }
                    }
                  }}
                  className="w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Operating Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSchoolDay(false)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      !isSchoolDay
                        ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs"
                        : "bg-background border-border text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    School Closed
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSchoolDay(true)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      isSchoolDay
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs"
                        : "bg-background border-border text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    School Open
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Reason / Notes
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Typhoon Warning / Public Holiday / Makeup Class"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  disabled={saving || !selectedDate}
                  className="w-full text-xs h-9 gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Calendar Override"}
                </Button>

                {isSelectedDateOverridden && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deleting}
                    onClick={handleDeleteException}
                    className="w-full text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/40 gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting ? "Removing..." : "Reset to Default Weekday/Weekend"}
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
