"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Users,
  Check,
  X,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchDirectorLeaveRequests,
  fetchLeaveStats,
  updateLeaveRequestStatus,
  LeaveRequestItem,
  LeaveStats,
} from "@/lib/api/leaves";
import { fetchSchools, School } from "@/lib/api/schools";

export function DirectorLeaveRequestsView() {
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal Action State
  const [targetRequest, setTargetRequest] = useState<LeaveRequestItem | null>(null);
  const [pendingStatus, setPendingStatus] = useState<"approved" | "rejected" | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadDirectorData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [schRes, leavesData, statsData] = await Promise.all([
        fetchSchools(),
        fetchDirectorLeaveRequests({
          schoolId: selectedSchoolId !== "all" ? selectedSchoolId : undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
        }),
        fetchLeaveStats(selectedSchoolId !== "all" ? selectedSchoolId : undefined),
      ]);

      if (schRes?.isSuccess) setSchools(schRes.data || []);
      setRequests(Array.isArray(leavesData) ? leavesData : []);
      setStats(statsData || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load director leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectorData();
  }, [selectedSchoolId, selectedStatus]);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const promptAction = (req: LeaveRequestItem, status: "approved" | "rejected") => {
    setTargetRequest(req);
    setPendingStatus(status);
    setReviewNotes(
      status === "approved"
        ? "Executive approval granted by Director."
        : "Executive rejection by Director due to institutional requirements."
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

      setActionSuccess(
        `Leave request for ${targetRequest.user?.fullName || "Faculty"} has been updated to ${pendingStatus}.`
      );
      setTimeout(() => setActionSuccess(null), 5000);

      closeActionModal();
      await loadDirectorData();
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
            <Building2 className="h-5 w-5 text-primary" />
            Institutional Leave Governance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-campus faculty leave ledger, attendance impact monitoring, and executive authorization.
          </p>
        </div>

        {/* Campus Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="h-9 px-3 rounded-lg border bg-background text-xs font-semibold text-foreground focus:outline-hidden"
          >
            <option value="all">All Campuses ({schools.length})</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
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

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs border-l-4 border-l-primary">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Requests
            </span>
            <div className="text-2xl font-bold text-foreground">{stats?.total ?? requests.length}</div>
            <p className="text-[10px] text-muted-foreground">Institutional applications</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-emerald-500">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              On Leave Today
            </span>
            <div className="text-2xl font-bold text-emerald-600">{stats?.onLeaveToday ?? 0}</div>
            <p className="text-[10px] text-muted-foreground">Active authorized absences</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-amber-500">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Pending Review
            </span>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.pending ?? requests.filter((r) => r.status === "pending").length}
            </div>
            <p className="text-[10px] text-muted-foreground">Awaiting evaluation</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-purple-500">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Approved
            </span>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.approved ?? requests.filter((r) => r.status === "approved").length}
            </div>
            <p className="text-[10px] text-muted-foreground">Authorized leaves</p>
          </CardContent>
        </Card>
      </div>

      {/* ── SEARCH & STATUS FILTERS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2">
          {["all", "pending", "approved", "rejected"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                selectedStatus === st
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search faculty, email, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadDirectorData()}
            className="pl-8 text-xs h-9"
          />
        </div>
      </div>

      {/* ── MASTER LEDGER ── */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          Loading institutional leave ledger...
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center border rounded-xl border-dashed text-xs text-muted-foreground space-y-1">
          <Filter className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
          <p className="font-semibold text-foreground">No records match the current filters</p>
          <p>Try switching campuses or adjusting the status selector.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id} className="shadow-xs hover:border-primary/30 transition-all">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-foreground">{req.user?.fullName || "Staff"}</span>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {req.user?.role || "Faculty"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-primary">
                      {req.school?.name || "Campus Unit"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">&bull; {req.user?.email}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {req.startDate} &mdash; {req.endDate}
                    </span>
                    <span className="text-[11px]">({calculateDays(req.startDate, req.endDate)} days)</span>
                    <span className="text-[11px]">Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded-md border leading-relaxed">
                    <strong className="text-foreground">Reason:</strong> {req.reason}
                  </p>

                  {req.reviewedBy && (
                    <div className="text-[11px] text-muted-foreground pt-0.5">
                      <strong>Reviewed by:</strong> {req.reviewedBy.fullName} ({req.reviewedBy.role})
                      {req.reviewNotes && <span className="ml-1 italic">&ldquo;{req.reviewNotes}&rdquo;</span>}
                    </div>
                  )}
                </div>

                {/* Status & Executive Overrides */}
                <div className="flex md:flex-col items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                  <div>
                    {req.status === "pending" && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-500/10 border-amber-500/30 font-semibold gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                    {req.status === "approved" && (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/30 font-semibold gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved
                      </Badge>
                    )}
                    {req.status === "rejected" && (
                      <Badge variant="outline" className="text-[10px] text-destructive bg-destructive/10 border-destructive/30 font-semibold gap-1">
                        <XCircle className="h-3 w-3" />
                        Rejected
                      </Badge>
                    )}
                  </div>

                  {req.status === "pending" && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => promptAction(req, "rejected")}
                        className="text-[11px] text-destructive hover:bg-destructive/10 border-destructive/20 h-7 px-2 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => promptAction(req, "approved")}
                        className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2 cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── EXECUTIVE ACTION CONFIRMATION MODAL ── */}
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
                Executive {pendingStatus} Decision
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                You are executing an executive {pendingStatus} for{" "}
                <strong className="text-foreground">{targetRequest.user?.fullName}</strong> (
                {targetRequest.school?.name || "Campus Unit"}).
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  Executive Decision Remarks
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewNotes(e.target.value)}
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
                {actionLoading ? "Processing..." : `Confirm Executive ${pendingStatus}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
