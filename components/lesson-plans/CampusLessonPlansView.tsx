"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Users,
  Award,
  Search,
  MessageSquare,
  Sparkles,
  Layers,
  CalendarOff,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchCampusLessonPlans,
  reviewLessonPlan,
  CampusLessonPlansResponse,
  LessonPlanItem,
} from "@/lib/api/lesson-plans";

export function CampusLessonPlansView() {
  const [data, setData] = useState<CampusLessonPlansResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Date and filter states
  const todayStr = new Date().toISOString().split("T")[0];
  const [targetDate, setTargetDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "reviewed" | "excused">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Review Modal State
  const [selectedPlan, setSelectedPlan] = useState<LessonPlanItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"reviewed" | "needs_revision">("reviewed");
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const loadData = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCampusLessonPlans({
        date,
        status: activeTab === "excused" ? undefined : activeTab,
        search: searchQuery || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load campus lesson plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(targetDate);
  }, [targetDate, activeTab]);

  const handleOpenReview = (plan: LessonPlanItem) => {
    setSelectedPlan(plan);
    setReviewStatus(plan.status === "needs_revision" ? "needs_revision" : "reviewed");
    setReviewNotes(plan.reviewNotes || "");
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    try {
      setSubmittingReview(true);
      setError(null);
      await reviewLessonPlan(selectedPlan.id, {
        status: reviewStatus,
        reviewNotes: reviewNotes.trim() || undefined,
      });

      setSuccessMsg(`Plan "${selectedPlan.title}" successfully updated!`);
      setSelectedPlan(null);
      await loadData(targetDate);
    } catch (err: any) {
      setError(err?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const summary = data?.summary || {
    totalTeachers: 0,
    submittedCount: 0,
    excusedOnLeaveCount: 0,
    missingCount: 0,
    pendingReviewCount: 0,
    reviewedCount: 0,
    complianceRate: 100,
  };

  const plans = data?.plans || [];
  const excusedStaff = data?.excusedStaff || [];

  const filteredPlans = plans.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.teacher?.fullName?.toLowerCase().includes(q) ||
      p.subject?.name?.toLowerCase().includes(q) ||
      p.class?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 backdrop-blur border border-border/60 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Campus Lesson Plan Review & Compliance
            </h2>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Headmaster Portal
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Audit daily teacher submissions, evaluate pedagogical alignment, and monitor leave exemptions.
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
            onClick={() => loadData(targetDate)}
            disabled={loading}
            className="rounded-xl h-9"
          >
            {loading ? "Syncing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Faculty
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {summary.totalTeachers}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Submitted Today
              </p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5">
                {summary.submittedCount}
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
                Excused (On Leave)
              </p>
              <h3 className="text-xl font-bold text-blue-600 mt-0.5">
                {summary.excusedOnLeaveCount}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <CalendarOff className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Missing on Duty
              </p>
              <h3 className="text-xl font-bold text-amber-600 mt-0.5">
                {summary.missingCount}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Compliance Rate
              </p>
              <h3 className="text-xl font-bold text-primary mt-0.5">
                {summary.complianceRate}%
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Award className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All Submissions ({plans.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === "pending"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Pending Review ({summary.pendingReviewCount})
          </button>
          <button
            onClick={() => setActiveTab("reviewed")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === "reviewed"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Reviewed ({summary.reviewedCount})
          </button>
          <button
            onClick={() => setActiveTab("excused")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === "excused"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Excused on Leave ({excusedStaff.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teacher, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs w-full sm:w-56 rounded-lg"
          />
        </div>
      </div>

      {/* Tab: Excused Staff (On Leave) */}
      {activeTab === "excused" ? (
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-blue-600" />
              Faculty Excused from Lesson Plans (On Approved Leave)
            </CardTitle>
            <CardDescription className="text-xs">
              Staff with approved leave requests in the database covering {targetDate}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {excusedStaff.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-xs font-medium">No faculty members on approved leave today</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {excusedStaff.map((item) => (
                  <div key={item.leaveId} className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                        Staff ID: {item.teacherId.slice(0, 8)}...
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Leave Period: {item.startDate} to {item.endDate}
                      </p>
                      <p className="text-xs text-foreground/80 mt-0.5">
                        Reason: <em>"{item.reason}"</em>
                      </p>
                    </div>
                    <Badge className="bg-blue-500/15 text-blue-600 border border-blue-500/20 text-xs">
                      Excused from Upload
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Tab: Lesson Plan Submissions List */
        <div className="space-y-3">
          {filteredPlans.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">No lesson plans match the current filters</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adjust date or status tab to view submitted plans.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPlans.map((plan) => (
              <Card key={plan.id} className="border-border/80 hover:border-primary/40 transition shadow-xs">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground">
                          {plan.title}
                        </h3>
                        {plan.isLate && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                            Late Submission
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
                            ? "Reviewed & Approved"
                            : plan.status === "needs_revision"
                            ? "Needs Revision"
                            : "Pending Review"}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Teacher: <strong className="text-foreground">{plan.teacher?.fullName || "Faculty"}</strong> (
                        {plan.teacher?.email}) • Subject:{" "}
                        <strong className="text-foreground">{plan.subject?.name || "General"}</strong> • Class:{" "}
                        <strong className="text-foreground">{plan.class?.name || "All"}</strong>
                      </p>

                      {plan.topic && (
                        <p className="text-xs text-foreground/90 font-medium">
                          Topic: {plan.topic}
                        </p>
                      )}

                      {plan.objectives && (
                        <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/20 p-2 rounded-lg border border-border/40">
                          {plan.objectives}
                        </p>
                      )}

                      {plan.justification && (
                        <p className="text-xs text-amber-600">
                          Justification Note: <em>"{plan.justification}"</em>
                        </p>
                      )}

                      {plan.reviewNotes && (
                        <div className="p-2 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                          <span className="font-semibold text-primary">Your Review Remarks:</span>{" "}
                          {plan.reviewNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 shrink-0">
                      {plan.fileUrl && (
                        <a
                          href={plan.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition"
                        >
                          <Download className="w-3.5 h-3.5 text-primary" />
                          Document ({plan.fileName || "File"})
                        </a>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleOpenReview(plan)}
                        className="rounded-xl text-xs h-8 gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {plan.status === "pending" ? "Review & Approve" : "Update Feedback"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Review Dialog / Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <Card className="max-w-lg w-full shadow-xl border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Evaluate Lesson Plan
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedPlan.title} • {selectedPlan.teacher?.fullName}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSaveReview}>
              <CardContent className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Evaluation Decision
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewStatus("reviewed")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                        reviewStatus === "reviewed"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve (Reviewed)
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewStatus("needs_revision")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                        reviewStatus === "needs_revision"
                          ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      Needs Revision
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Pedagogical Feedback & Guidance
                  </label>
                  <Textarea
                    placeholder="Provide constructive feedback, activity recommendations, or approval notes..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    className="rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlan(null)}
                  disabled={submittingReview}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingReview}
                  className="rounded-xl text-xs font-semibold"
                >
                  {submittingReview ? "Saving..." : "Save Evaluation"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
