"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Users,
  Award,
  Search,
  Sparkles,
  TrendingUp,
  Layers,
  CalendarOff,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchDirectorLessonPlans,
  DirectorLessonPlansResponse,
  LessonPlanItem,
} from "@/lib/api/lesson-plans";

export function DirectorLessonPlansView() {
  const [data, setData] = useState<DirectorLessonPlansResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Date and filter states
  const todayStr = new Date().toISOString().split("T")[0];
  const [targetDate, setTargetDate] = useState<string>(todayStr);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDirectorLessonPlans({
        date: targetDate,
        schoolId: selectedSchoolId !== "all" ? selectedSchoolId : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load director lesson plan metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetDate, selectedSchoolId, statusFilter]);

  const summary = data?.summary || {
    totalCampuses: 0,
    totalSubmitted: 0,
    totalReviewed: 0,
    totalPending: 0,
  };

  const campusMetrics = data?.campusMetrics || [];
  const plans = data?.plans || [];

  const filteredPlans = plans.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.teacher?.fullName?.toLowerCase().includes(q) ||
      p.school?.name?.toLowerCase().includes(q) ||
      p.subject?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 backdrop-blur border border-border/60 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Institutional Lesson Plan Compliance
            </h2>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Director Portal
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cross-campus curriculum tracking, leave exemption audits, and institutional compliance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background/80 border border-border px-3 py-1.5 rounded-xl shadow-xs">
            <Calendar className="w-4 h-4 text-primary" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-medium focus:outline-hidden text-foreground"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl h-9"
          >
            {loading ? "Syncing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Institutional KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Campuses
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {summary.totalCampuses}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Submitted
              </p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5">
                {summary.totalSubmitted}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Reviewed by Campuses
              </p>
              <h3 className="text-xl font-bold text-blue-600 mt-0.5">
                {summary.totalReviewed}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Award className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Awaiting Evaluation
              </p>
              <h3 className="text-xl font-bold text-amber-600 mt-0.5">
                {summary.totalPending}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campus Breakdown Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Campus Compliance Scorecard
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campusMetrics.map((campus) => (
            <Card key={campus.schoolId} className="border-border/80 shadow-xs">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {campus.schoolName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Code: {campus.campusCode || "CAMPUS"} • Faculty: {campus.teacherCount}
                    </p>
                  </div>
                  <Badge
                    className={
                      campus.complianceRate >= 90
                        ? "bg-emerald-500 text-white text-xs"
                        : campus.complianceRate >= 70
                        ? "bg-amber-500 text-white text-xs"
                        : "bg-destructive text-white text-xs"
                    }
                  >
                    {campus.complianceRate}% Compliance
                  </Badge>
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      campus.complianceRate >= 90
                        ? "bg-emerald-500"
                        : campus.complianceRate >= 70
                        ? "bg-amber-500"
                        : "bg-destructive"
                    }`}
                    style={{ width: `${Math.min(100, campus.complianceRate)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-border/60">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Submitted</span>
                    <strong className="text-foreground">{campus.submittedCount}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Excused (Leave)</span>
                    <strong className="text-blue-600">{campus.approvedLeaves}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Reviewed</span>
                    <strong className="text-emerald-600">{campus.reviewedCount}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Global Submissions Table */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Multi-Campus Lesson Plan Audit
              </CardTitle>
              <CardDescription className="text-xs">
                Comprehensive record of submitted plans and evaluations across institutions
              </CardDescription>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
              >
                <option value="all">All Campuses</option>
                {campusMetrics.map((c) => (
                  <option key={c.schoolId} value={c.schoolId}>
                    {c.schoolName}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="needs_revision">Needs Revision</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search plan or teacher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs w-full sm:w-44 rounded-lg"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredPlans.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-xs font-medium">No lesson plans found for the selected criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground">
                        {plan.title}
                      </h4>
                      <Badge variant="outline" className="text-[10px]">
                        {plan.school?.name || "Campus"}
                      </Badge>
                      {plan.isLate && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                          Late
                        </Badge>
                      )}
                      <Badge
                        className={
                          plan.status === "reviewed"
                            ? "bg-emerald-500 text-white text-[10px]"
                            : plan.status === "needs_revision"
                            ? "bg-amber-500 text-white text-[10px]"
                            : "bg-blue-500/15 text-blue-600 text-[10px]"
                        }
                      >
                        {plan.status === "reviewed"
                          ? "Reviewed"
                          : plan.status === "needs_revision"
                          ? "Needs Revision"
                          : "Pending"}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Teacher: <strong className="text-foreground">{plan.teacher?.fullName}</strong> • Subject:{" "}
                      {plan.subject?.name || "General"} • Class: {plan.class?.name || "General"} • Date: {plan.date}
                    </p>

                    {plan.reviewNotes && (
                      <p className="text-xs text-primary font-medium">
                        Evaluation Note: "{plan.reviewNotes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {plan.fileUrl && (
                      <a
                        href={plan.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        Download ({plan.fileName || "File"})
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
