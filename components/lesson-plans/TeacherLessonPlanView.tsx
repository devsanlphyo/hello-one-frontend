"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  FileText,
  Upload,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Download,
  Sparkles,
  BookOpen,
  GraduationCap,
  Coffee,
  CalendarOff,
  Layers,
  Search,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchClasses, ClassItem } from "@/lib/api/classes";
import { fetchSubjects, Subject } from "@/lib/api/subjects";
import {
  fetchDailyLessonPlanStatus,
  fetchMyLessonPlans,
  submitLessonPlan,
  deleteLessonPlan,
  DailyLessonPlanStatus,
  LessonPlanItem,
} from "@/lib/api/lesson-plans";

export function TeacherLessonPlanView() {
  const [dailyStatus, setDailyStatus] = useState<DailyLessonPlanStatus | null>(
    null,
  );
  const [plans, setPlans] = useState<LessonPlanItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [targetDate, setTargetDate] = useState<string>(todayStr);
  const [title, setTitle] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [objectives, setObjectives] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [justification, setJustification] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter State for History
  const [historySearch, setHistorySearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const [statusData, plansData, classesRes, subjectsRes] =
        await Promise.all([
          fetchDailyLessonPlanStatus(date),
          fetchMyLessonPlans({
            status: statusFilter !== "all" ? statusFilter : undefined,
          }),
          fetchClasses(),
          fetchSubjects(),
        ]);

      setDailyStatus(statusData);
      setPlans(Array.isArray(plansData) ? plansData : []);
      if (classesRes?.isSuccess) setClasses(classesRes.data || []);
      if (subjectsRes?.isSuccess) setSubjects(subjectsRes.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load lesson plan data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(targetDate);
  }, [targetDate, statusFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024 * 1024) {
        setError("File exceeds 100MB maximum limit");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a lesson title");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await submitLessonPlan({
        date: targetDate,
        title: title.trim(),
        topic: topic.trim() || undefined,
        objectives: objectives.trim() || undefined,
        classId: selectedClassId || undefined,
        subjectId: selectedSubjectId || undefined,
        justification: justification.trim() || undefined,
        file: selectedFile || undefined,
      });

      setSuccessMsg("Lesson plan submitted successfully!");
      setTitle("");
      setTopic("");
      setObjectives("");
      setSelectedClassId("");
      setSelectedSubjectId("");
      setJustification("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Reload
      await loadData(targetDate);
    } catch (err: any) {
      setError(err?.message || "Failed to submit lesson plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pending lesson plan?"))
      return;
    try {
      setDeletingId(id);
      await deleteLessonPlan(id);
      setSuccessMsg("Lesson plan deleted successfully");
      await loadData(targetDate);
    } catch (err: any) {
      setError(err?.message || "Failed to delete lesson plan");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = plans.filter((p) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.topic?.toLowerCase().includes(q) ||
      p.subject?.name?.toLowerCase().includes(q) ||
      p.class?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 backdrop-blur border border-border/60 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Lesson Plan Management
            </h2>
            <Badge
              variant="outline"
              className="text-xs bg-primary/10 text-primary border-primary/20"
            >
              Teacher Flow
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Submit daily curriculum outlines, check duty status, and monitor
            review feedback.
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

      {/* Flowchart Decision Gate Logic */}
      {dailyStatus && (
        <>
          {/* BRANCH 1: IsLeaveDay? === TRUE */}
          {dailyStatus.isLeaveDay && (
            <Card className="border-emerald-500/40 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-600 rounded-xl mt-0.5">
                      <CalendarCheck2Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">
                          Show not required to upload the lesson plan page
                        </h3>
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 text-xs">
                          Approved Leave
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        You have an approved leave on this date:{" "}
                        <strong className="text-foreground">
                          {dailyStatus.leaveDetails?.startDate} to{" "}
                          {dailyStatus.leaveDetails?.endDate}
                        </strong>
                        .
                      </p>
                      {dailyStatus.leaveDetails?.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Reason: <em>"{dailyStatus.leaveDetails.reason}"</em>
                        </p>
                      )}
                      <p className="text-xs text-emerald-600 font-medium mt-2">
                        ✓ Institutional compliance: Lesson plan submission is
                        waived for today. No further action required.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BRANCH 2: !IsDutyDay && !IsLeaveDay */}
          {!dailyStatus.isLeaveDay && !dailyStatus.isDutyDay && (
            <Card className="border-amber-500/30 bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-amber-500/20 text-amber-600 rounded-xl mt-0.5">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">
                        Not Required: Off-Duty Day
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-500/30 text-amber-600"
                      >
                        Off Shift / Weekend
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      No active teaching shift or classroom schedule is assigned
                      for {dailyStatus.date}. Daily lesson plan uploads are not
                      required for off-duty days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BRANCH 3: IsDutyDay === TRUE && !IsLeaveDay -> SHOW UPLOAD FORM */}
          {!dailyStatus.isLeaveDay && dailyStatus.isDutyDay && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="border-border shadow-xs">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Upload className="w-4 h-4 text-primary" />
                        Show to upload lesson plan
                      </CardTitle>
                      {dailyStatus.shiftDetails && (
                        <Badge
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          Shift: {dailyStatus.shiftDetails.name} (
                          {dailyStatus.shiftDetails.startTime} -{" "}
                          {dailyStatus.shiftDetails.endTime})
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      Submit today's curriculum objectives, outline, and plan
                      documents (PDF, DOCX, PPTX up to 100MB).
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">
                            Target Subject
                          </label>
                          <select
                            value={selectedSubjectId}
                            onChange={(e) =>
                              setSelectedSubjectId(e.target.value)
                            }
                            className="w-full text-xs sm:text-sm bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                          >
                            <option value="">Select subject...</option>
                            {subjects.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name} ({sub.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">
                            Target Class
                          </label>
                          <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full text-xs sm:text-sm bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                          >
                            <option value="">Select class...</option>
                            {classes.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name} ({cls.gradeLevel})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          Lesson Title{" "}
                          <span className="text-destructive">*</span>
                        </label>
                        <Input
                          placeholder="e.g. Unit 4: Quadratic Equations & Parabolic Modeling"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="rounded-xl text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          Key Topic / Section
                        </label>
                        <Input
                          placeholder="e.g. Factoring trinomials and real-world trajectory exercises"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className="rounded-xl text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          Learning Objectives & Pedagogical Steps
                        </label>
                        <Textarea
                          placeholder="1. Review previous homework on factoring.&#10;2. Introduce vertex formula with interactive whiteboard.&#10;3. Guided group practice solving trajectory problems."
                          value={objectives}
                          onChange={(e) => setObjectives(e.target.value)}
                          rows={4}
                          className="rounded-xl text-xs sm:text-sm"
                        />
                      </div>

                      {/* File Attachment Upload (Max 100MB) */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          Attach Plan Document (Max 100MB)
                        </label>
                        <div className="border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-xl p-4 text-center cursor-pointer bg-muted/20">
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
                            className="hidden"
                            id="lesson-plan-file-input"
                          />
                          <label
                            htmlFor="lesson-plan-file-input"
                            className="cursor-pointer"
                          >
                            <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1.5" />
                            {selectedFile ? (
                              <div>
                                <p className="text-xs font-semibold text-foreground truncate max-w-xs mx-auto">
                                  {selectedFile.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {(selectedFile.size / (1024 * 1024)).toFixed(
                                    2,
                                  )}{" "}
                                  MB • Click to change
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs font-medium text-foreground">
                                  Click to upload document or presentation
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  PDF, DOCX, PPTX, or TXT up to 100MB
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Late Justification (if applicable) */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          Submission Justification (Optional)
                        </label>
                        <Input
                          placeholder="Note if submitting past deadline or replacement plan"
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                          className="rounded-xl text-xs sm:text-sm"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl gap-2 font-semibold h-10 shadow-xs"
                      >
                        {submitting
                          ? "Saving in DB..."
                          : "Submit Lesson Plan (Save in DB)"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Submissions Column */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border-border shadow-xs">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">
                        Today's Submissions
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {dailyStatus.todayPlans.length} Submitted
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Lesson plans on record for {dailyStatus.date}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dailyStatus.todayPlans.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl p-4">
                        <FileText className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-xs font-medium">
                          No plans submitted yet today
                        </p>
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                          Use the form on the left to upload your daily
                          curriculum plan.
                        </p>
                      </div>
                    ) : (
                      dailyStatus.todayPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="p-3.5 rounded-xl border border-border/80 bg-background/50 hover:bg-muted/30 transition space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1">
                                {plan.title}
                              </h4>
                              <p className="text-[11px] text-muted-foreground">
                                {plan.subject?.name || "General"} •{" "}
                                {plan.class?.name || "All Classes"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {plan.isLate && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-amber-600 border-amber-500/30"
                                >
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
                                    : "Pending Review"}
                              </Badge>
                            </div>
                          </div>

                          {plan.topic && (
                            <p className="text-xs text-foreground/80 line-clamp-2">
                              {plan.topic}
                            </p>
                          )}

                          {plan.reviewNotes && (
                            <div className="p-2 rounded-lg bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground">
                              <span className="font-semibold text-primary">
                                Headmaster Feedback:
                              </span>{" "}
                              {plan.reviewNotes}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                            <span>
                              {new Date(plan.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <div className="flex items-center gap-2">
                              {plan.fileUrl && (
                                <a
                                  href={plan.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" /> Document
                                </a>
                              )}
                              {plan.status === "pending" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  disabled={deletingId === plan.id}
                                  onClick={() => handleDelete(plan.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {/* History & Past Submissions */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Lesson Plan Submission History
              </CardTitle>
              <CardDescription className="text-xs">
                Archived records and Headmaster evaluations across academic
                terms
              </CardDescription>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search plans..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-36 sm:w-48 rounded-lg"
                />
              </div>

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
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs font-medium">No submission history found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        {item.title}
                      </h4>
                      {item.isLate && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-amber-600 border-amber-500/30"
                        >
                          Late
                        </Badge>
                      )}
                      <Badge
                        className={
                          item.status === "reviewed"
                            ? "bg-emerald-500 text-white text-[10px]"
                            : item.status === "needs_revision"
                              ? "bg-amber-500 text-white text-[10px]"
                              : "bg-blue-500/15 text-blue-600 text-[10px]"
                        }
                      >
                        {item.status === "reviewed"
                          ? "Reviewed"
                          : item.status === "needs_revision"
                            ? "Needs Revision"
                            : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Date:{" "}
                      <strong className="text-foreground">{item.date}</strong> •
                      Subject: {item.subject?.name || "General"} • Class:{" "}
                      {item.class?.name || "General"}
                    </p>
                    {item.topic && (
                      <p className="text-xs text-foreground/80 line-clamp-1">
                        Topic: {item.topic}
                      </p>
                    )}
                    {item.reviewNotes && (
                      <p className="text-xs text-primary font-medium">
                        Headmaster Note: "{item.reviewNotes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        Download
                      </a>
                    )}
                    {item.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive h-8 px-2 text-xs"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
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

function CalendarCheck2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
      <path d="M3 10h18" />
      <path d="m16 20 2 2 4-4" />
    </svg>
  );
}
