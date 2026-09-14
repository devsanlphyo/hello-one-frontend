"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Award,
  TrendingUp,
  User as UserIcon,
  Sparkles,
  Search,
  CalendarCheck,
  CalendarRange,
  BookMarked,
} from "lucide-react";
import { StaffPortalLayout, NavTabItem } from "@/components/portal/StaffPortalLayout";
import { StaffProfileTab } from "@/components/portal/StaffProfileTab";
import { MonitorAttendanceView } from "@/components/attendance/MonitorAttendanceView";
import { DirectorLeaveRequestsView } from "@/components/leaves/DirectorLeaveRequestsView";
import { DirectorLessonPlansView } from "@/components/lesson-plans/DirectorLessonPlansView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { fetchSchools, School } from "@/lib/api/schools";
import { fetchUsers } from "@/lib/api/users";
import type { User } from "@/app/admin/users/types/user.type";

export default function DirectorPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [schools, setSchools] = useState<School[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function loadDirectorData() {
      setLoading(true);
      try {
        const [schRes, facRes] = await Promise.all([
          fetchSchools(),
          fetchUsers(),
        ]);

        if (schRes?.isSuccess) setSchools(schRes.data || []);
        if (facRes?.isSuccess) setFaculty(facRes.data || []);
      } catch {
        // graceful fallback
      } finally {
        setLoading(false);
      }
    }
    loadDirectorData();
  }, []);

  const tabs: NavTabItem[] = [
    { id: "overview", label: "Executive Overview", icon: Sparkles },
    { id: "lesson-plans", label: "Lesson Plans", icon: BookMarked },
    { id: "leaves", label: "Leave Requests", icon: CalendarRange },
    { id: "attendance", label: "Monitor Attendances", icon: CalendarCheck },
    { id: "schools", label: "Schools & Campuses", icon: Building2, badge: schools.length },
    { id: "faculty", label: "Faculty Directory", icon: Users, badge: faculty.length },
    { id: "profile", label: "Profile & Workstation", icon: UserIcon },
  ];

  const filteredSchools = schools.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <StaffPortalLayout
      roleTitle="Director"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── TAB: LESSON PLANS (Multi-Campus Overview & Audit) ── */}
      {activeTab === "lesson-plans" && (
        <DirectorLessonPlansView />
      )}

      {/* ── TAB: MONITOR ATTENDANCES (Cross-Campus) ── */}
      {activeTab === "attendance" && (
        <MonitorAttendanceView allowCrossCampus={true} />
      )}

      {/* ── TAB: LEAVE REQUESTS (Matching Flow 3) ── */}
      {activeTab === "leaves" && <DirectorLeaveRequestsView />}

      {/* ── TAB 1: EXECUTIVE OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Institutional Executive Portal
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Welcome back, Director {user?.fullName}. High-level campus metrics and institutional governance.
            </p>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="shadow-xs border-l-4 border-l-purple-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Campuses
                </span>
                <div className="text-2xl font-bold">{schools.length}</div>
                <p className="text-[10px] text-muted-foreground">Operating academic branches</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-indigo-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Total Staff
                </span>
                <div className="text-2xl font-bold">{faculty.length}</div>
                <p className="text-[10px] text-muted-foreground">Employed educators &amp; staff</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-emerald-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Accreditation
                </span>
                <div className="text-sm font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>Standard Verified</span>
                </div>
                <p className="text-[10px] text-muted-foreground">National Education Board</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-amber-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Operations
                </span>
                <div className="text-sm font-bold text-amber-600 mt-1.5 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>100% In-Session</span>
                </div>
                <p className="text-[10px] text-muted-foreground">All facilities online</p>
              </CardContent>
            </Card>
          </div>

          {/* Campuses Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Institutional Campuses</h3>
              <button
                type="button"
                onClick={() => setActiveTab("schools")}
                className="text-xs text-primary font-medium hover:underline cursor-pointer"
              >
                View all campuses &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {schools.map((s) => (
                <Card key={s.id} className="shadow-xs hover:border-primary/40 transition-colors">
                  <CardHeader className="p-3.5 pb-2">
                    <div className="flex items-start justify-between gap-1">
                      <CardTitle className="text-xs font-bold leading-tight">{s.name}</CardTitle>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-purple-500/30 text-purple-600 bg-purple-500/5 font-mono">
                        {s.code || "CAMPUS"}
                      </Badge>
                    </div>
                    <CardDescription className="text-[11px] mt-1">
                      Classes: {s.classesCount || 0} &bull; Subjects: {s.subjectsCount || 0}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3.5 text-[11px] text-muted-foreground border-t mt-2 pt-2 flex items-center justify-between">
                    <span className="truncate">Principal: {s.principalName || s.headmaster?.fullName || "Assigned"}</span>
                    <Badge variant="secondary" className="text-[9px] capitalize">{s.status || "active"}</Badge>
                  </CardContent>
                </Card>
              ))}
              {schools.length === 0 && !loading && (
                <div className="col-span-full p-8 text-center text-xs text-muted-foreground border rounded-lg border-dashed">
                  No registered campuses found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SCHOOLS & CAMPUSES ── */}
      {activeTab === "schools" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Institutional Campuses</h2>
              <p className="text-xs text-muted-foreground">
                All physical and regional schools under board administration.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSchools.map((s) => (
              <Card key={s.id} className="shadow-xs">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{s.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        School Code: {s.code} &bull; Status: {s.status}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {s.code || "SCH"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t text-muted-foreground">
                    <div>
                      <span className="text-[10px] uppercase block font-medium">Headmaster</span>
                      <span className="font-semibold text-foreground truncate block">
                        {s.headmaster?.fullName || s.principalName || "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase block font-medium">Curriculum</span>
                      <span className="text-foreground truncate block">
                        {s.subjectsCount || 0} Subject Areas
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredSchools.length === 0 && (
              <div className="col-span-full p-8 text-center text-xs text-muted-foreground border rounded-lg border-dashed">
                No matching campuses found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: FACULTY DIRECTORY ── */}
      {activeTab === "faculty" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Institutional Faculty Directory</h2>
            <p className="text-xs text-muted-foreground">
              Roster of educators and staff across all departments and campuses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {faculty.slice(0, 30).map((f) => (
              <Card key={f.id} className="shadow-xs">
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-foreground truncate">{f.fullName}</h4>
                    <p className="text-[11px] text-muted-foreground truncate">{f.email}</p>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3 inline text-primary" />
                      {f.school?.name || "District Staff"}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[9px] uppercase shrink-0">
                    {f.role}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: PROFILE & WORKSTATION ── */}
      {activeTab === "profile" && <StaffProfileTab />}
    </StaffPortalLayout>
  );
}
