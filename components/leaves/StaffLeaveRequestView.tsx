"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  CalendarRange,
  FileText,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchMyLeaveRequests,
  submitLeaveRequest,
  LeaveRequestItem,
} from "@/lib/api/leaves";

export function StaffLeaveRequestView() {
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [reason, setReason] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyLeaveRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load your leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Calculate day count
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const dayCount = calculateDays(startDate, endDate);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setError("Please fill in all fields (start date, end date, and reason).");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date must be on or after start date.");
      return;
    }
    setError(null);
    setShowConfirmModal(true);
  };

  const confirmSubmission = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await submitLeaveRequest({
        startDate,
        endDate,
        reason: reason.trim(),
      });
      setShowConfirmModal(false);
      setReason("");
      setSuccessMsg("Your leave request has been submitted successfully and is pending review.");
      setTimeout(() => setSuccessMsg(null), 5000);
      await loadRequests();
    } catch (err: any) {
      setError(err?.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            Leave Request &amp; Status Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Submit time off requests to your headmaster and monitor application statuses in real-time.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── FLOW 1: SUBMIT NEW REQUEST FORM ── */}
        <Card className="lg:col-span-5 shadow-xs border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">Submit New Leave Request</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Fill in your requested dates and instructional leave details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs h-9"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs h-9"
                    required
                  />
                </div>
              </div>

              {/* Duration Preview Pill */}
              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 text-xs text-muted-foreground border">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Estimated Duration:
                </span>
                <span className="font-bold text-foreground">
                  {dayCount} {dayCount === 1 ? "day" : "days"}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Reason &amp; Coverage Plan</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the purpose of your leave (medical, academic conference, personal) and mention any class substitute plans..."
                  className="text-xs min-h-24 resize-none"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full text-xs font-semibold h-9 gap-1.5 shadow-xs cursor-pointer"
                disabled={submitting}
              >
                <Send className="h-3.5 w-3.5" />
                Submit Request for Approval
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── FLOW 1 FEEDBACK: SHOW ACCEPT/REJECT TO STAFF ── */}
        <Card className="lg:col-span-7 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold">My Leave History &amp; Status</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {requests.length} {requests.length === 1 ? "Record" : "Records"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Live updates on headmaster approvals, rejections, and review feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Loading your leave history...
              </div>
            ) : requests.length === 0 ? (
              <div className="py-12 text-center border rounded-lg border-dashed text-xs text-muted-foreground space-y-1">
                <CalendarRange className="h-7 w-7 mx-auto text-muted-foreground/50 mb-2" />
                <p className="font-medium text-foreground">No leave requests submitted yet</p>
                <p>Use the form on the left to submit your first leave application.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-lg border bg-card/60 hover:bg-muted/10 transition-all space-y-2.5 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-bold text-xs text-foreground">
                          {req.startDate} &mdash; {req.endDate}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          ({calculateDays(req.startDate, req.endDate)} days)
                        </span>
                      </div>

                      {/* Status Badges: Realizing 'show accept to staff' & 'show reject to staff' */}
                      <div>
                        {req.status === "pending" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 bg-amber-500/10 border-amber-500/30 font-semibold gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            Pending Review
                          </Badge>
                        )}
                        {req.status === "approved" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/30 font-semibold gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approved
                          </Badge>
                        )}
                        {req.status === "rejected" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-destructive bg-destructive/10 border-destructive/30 font-semibold gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-md border text-[11.5px] leading-relaxed">
                      <span className="font-semibold text-foreground block mb-0.5">Application Reason:</span>
                      {req.reason}
                    </div>

                    {/* Reviewer Note / Decision Details */}
                    {req.reviewedBy && (
                      <div className="flex items-start gap-2 text-[11px] pt-1 text-muted-foreground border-t">
                        <UserCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p>
                            <strong className="text-foreground">
                              {req.status === "approved" ? "Approved" : "Rejected"} by:
                            </strong>{" "}
                            {req.reviewedBy.fullName} ({req.reviewedBy.role})
                            {req.reviewedAt && (
                              <span className="ml-1 text-muted-foreground/80">
                                on {new Date(req.reviewedAt).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                          {req.reviewNotes && (
                            <p className="text-foreground/90 italic">
                              &ldquo;{req.reviewNotes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── CONFIRMATION MODAL ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-background border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in-90 zoom-in-95 duration-150">
            <div className="flex items-center gap-2 border-b pb-3">
              <CalendarRange className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Confirm Leave Submission</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to submit a leave request for{" "}
              <strong className="text-foreground">
                {startDate} to {endDate} ({dayCount} {dayCount === 1 ? "day" : "days"})
              </strong>
              ? Once submitted, it will be queued for your Headmaster&apos;s evaluation.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs cursor-pointer"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs cursor-pointer"
                onClick={confirmSubmission}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Confirm & Send"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
