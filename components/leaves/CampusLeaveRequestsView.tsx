"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  User,
  MessageSquare,
  Search,
  Filter,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchSchoolLeaveRequests,
  updateLeaveRequestStatus,
  LeaveRequestItem,
  LeaveStatus,
} from "@/lib/api/leaves";

interface CampusLeaveRequestsViewProps {
  schoolId?: string;
}

export function CampusLeaveRequestsView({ schoolId }: CampusLeaveRequestsViewProps) {
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal Action State
  const [targetRequest, setTargetRequest] = useState<LeaveRequestItem | null>(null);
  const [pendingStatus, setPendingStatus] = useState<"approved" | "rejected" | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSchoolLeaveRequests(schoolId);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load campus leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [schoolId]);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const pendingList = requests.filter((r) => r.status === "pending");
  const approvedList = requests.filter((r) => r.status === "approved");
  const rejectedList = requests.filter((r) => r.status === "rejected");

  const currentTabList =
    activeTab === "pending"
      ? pendingList
      : activeTab === "approved"
      ? approvedList
      : rejectedList;

  const filteredList = currentTabList.filter((r) => {
    const q = searchQuery.toLowerCase();
    const name = r.user?.fullName?.toLowerCase() || "";
    const email = r.user?.email?.toLowerCase() || "";
    const reason = r.reason.toLowerCase();
    return name.includes(q) || email.includes(q) || reason.includes(q);
  });

  const promptAction = (req: LeaveRequestItem, status: "approved" | "rejected") => {
    setTargetRequest(req);
    setPendingStatus(status);
    setReviewNotes(
      status === "approved"
        ? "Approved. Coverage arranged."
        : "Rejected due to academic timetable conflict."
    );
  };

  const closeActionModal = () => {
    setTargetRequest(null);
    setPendingStatus(null);
    setReviewNotes("");
  };

  const executeStatusUpdate = async () => {
    if (!targetRequest || !pendingStatus) return;
    try {
      setActionLoading(true);
      setError(null);
      await updateLeaveRequestStatus(targetRequest.id, {
        status: pendingStatus,
        reviewNotes: reviewNotes.trim() || undefined,
      });

      const actionWord = pendingStatus === "approved" ? "approved" : "rejected";
      setActionSuccess(
        `Leave request for ${targetRequest.user?.fullName || "Staff"} has been ${actionWord}. Status updated in staff portal.`
      );
      setTimeout(() => setActionSuccess(null), 5000);

      closeActionModal();
      await loadRequests();
    } catch (err: any) {
      setError(err?.message || "Failed to update leave request status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Campus Leave Requests &amp; Approvals
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review faculty leave applications, authorize time off, or reject submissions for your school.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search staff, dates, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ── FLOW 2 FILTER TABS (Pending / Approved / Rejected) ── */}
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "pending"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted/60"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Pending Review
          <span
            className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === "pending" ? "bg-white/20 text-white" : "bg-muted text-foreground"
            }`}
          >
            {pendingList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("approved")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "approved"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted/60"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Approved Leaves
          <span
            className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === "approved" ? "bg-white/20 text-white" : "bg-muted text-foreground"
            }`}
          >
            {approvedList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rejected")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "rejected"
              ? "bg-destructive text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted/60"
          }`}
        >
          <XCircle className="h-3.5 w-3.5" />
          Rejected Requests
          <span
            className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === "rejected" ? "bg-white/20 text-white" : "bg-muted text-foreground"
            }`}
          >
            {rejectedList.length}
          </span>
        </button>
      </div>

      {/* ── REQUESTS LIST ── */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          Loading campus leave requests...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-16 text-center border rounded-xl border-dashed text-xs text-muted-foreground space-y-1">
          <Filter className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
          <p className="font-semibold text-foreground">No {activeTab} leave requests</p>
          <p>There are currently no leave records in this category matching your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((req) => (
            <Card key={req.id} className="shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between">
              <CardHeader className="pb-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {req.user?.fullName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{req.user?.fullName || "Staff Member"}</h4>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {req.user?.role || "Faculty"} &bull; {req.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {req.status === "pending" && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-500/10 border-amber-500/30 font-semibold">
                        Pending
                      </Badge>
                    )}
                    {req.status === "approved" && (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/30 font-semibold">
                        Approved
                      </Badge>
                    )}
                    {req.status === "rejected" && (
                      <Badge variant="outline" className="text-[10px] text-destructive bg-destructive/10 border-destructive/30 font-semibold">
                        Rejected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {/* Dates Banner */}
                  <div className="p-2 rounded-md bg-muted/40 border text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {req.startDate} &mdash; {req.endDate}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {calculateDays(req.startDate, req.endDate)} days
                    </span>
                  </div>

                  {/* Reason */}
                  <div className="text-xs text-muted-foreground bg-muted/15 p-2.5 rounded-md border text-[11.5px] leading-relaxed">
                    <strong className="text-foreground block text-[11px] mb-0.5">Submitted Reason:</strong>
                    {req.reason}
                  </div>

                  {/* Review info if processed */}
                  {req.reviewedBy && (
                    <div className="text-[11px] text-muted-foreground border-t pt-1.5 space-y-0.5">
                      <p>
                        <strong>Evaluated by:</strong> {req.reviewedBy.fullName}
                      </p>
                      {req.reviewNotes && <p className="italic text-foreground/80">&ldquo;{req.reviewNotes}&rdquo;</p>}
                    </div>
                  )}
                </div>

                {/* FLOW 2 ACTIONS: Approve or Reject */}
                {req.status === "pending" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => promptAction(req, "rejected")}
                      className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 h-8 gap-1 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => promptAction(req, "approved")}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-8 gap-1 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── FLOW 2 ACTION CONFIRMATION MODAL ── */}
      {targetRequest && pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-background border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in-90 zoom-in-95 duration-150">
            <div className="flex items-center gap-2 border-b pb-3">
              {pendingStatus === "approved" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <h3 className="font-bold text-sm text-foreground capitalize">
                {pendingStatus} Leave Request
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Confirm {pendingStatus === "approved" ? "approval" : "rejection"} for{" "}
                <strong className="text-foreground">{targetRequest.user?.fullName}</strong> from{" "}
                <strong className="text-foreground">{targetRequest.startDate}</strong> to{" "}
                <strong className="text-foreground">{targetRequest.endDate}</strong>.
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  Reviewer Feedback / Reason (Optional)
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewNotes(e.target.value)}
                  placeholder="E.g., coverage confirmed with departmental team, or exam duties cannot be rescheduled..."
                  className="text-xs min-h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="text-xs cursor-pointer"
                onClick={closeActionModal}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className={`text-xs cursor-pointer ${
                  pendingStatus === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-destructive hover:bg-destructive/90 text-white"
                }`}
                onClick={executeStatusUpdate}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Updating..."
                  : pendingStatus === "approved"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
