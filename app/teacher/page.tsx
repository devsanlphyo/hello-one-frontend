"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarCheck,
  BookOpen,
  GraduationCap,
  Clock,
  User as UserIcon,
  Building,
  Sparkles,
  CalendarRange,
} from "lucide-react";
import { StaffPortalLayout, NavTabItem } from "@/components/portal/StaffPortalLayout";
import { StaffProfileTab } from "@/components/portal/StaffProfileTab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { fetchClasses, ClassItem } from "@/lib/api/classes";
import { fetchSubjects, Subject } from "@/lib/api/subjects";
import { CheckInOutWidget } from "@/components/attendance/CheckInOutWidget";
import { StaffLeaveRequestView } from "@/components/leaves/StaffLeaveRequestView";

export default function TeacherPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("attendance");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTeacherData() {
      setLoading(true);
      try {
        const [clsRes, subRes] = await Promise.all([
          fetchClasses(),
          fetchSubjects(),
        ]);

        if (clsRes?.isSuccess) setClasses(clsRes.data || []);
        if (subRes?.isSuccess) setSubjects(subRes.data || []);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    loadTeacherData();
  }, []);

  const tabs: NavTabItem[] = [
    { id: "attendance", label: "Check In / Out", icon: Clock },
    { id: "leaves", label: "Leave Requests", icon: CalendarRange },
    { id: "schedule", label: "My Schedule", icon: CalendarCheck },
    { id: "classes", label: "My Classes", icon: BookOpen, badge: classes.length },
    { id: "curriculum", label: "Curriculum", icon: GraduationCap, badge: subjects.length },
    { id: "profile", label: "Profile & Workstation", icon: UserIcon },
  ];

  return (
    <StaffPortalLayout
      roleTitle="Teacher"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── TAB: ATTENDANCE CHECK-IN / CHECK-OUT ── */}
      {activeTab === "attendance" && <CheckInOutWidget />}

      {/* ── TAB: LEAVE REQUESTS ── */}
      {activeTab === "leaves" && <StaffLeaveRequestView />}

      {/* ── TAB 1: MY SCHEDULE ── */}
      {activeTab === "schedule" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Instructor Daily Schedule</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Welcome back, Teacher {user?.fullName}. Here is your instructional timetable for today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Timeline View */}
            <Card className="md:col-span-2 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">Today's Class Sessions</CardTitle>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    Semester Term 1
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Academic teaching timetable and classroom assignments.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {[
                  {
                    time: "08:30 AM - 10:00 AM",
                    title: "Mathematics & Analytical Reasoning",
                    class: "Grade 10 - Section A",
                    room: "Room 204",
                    status: "Completed",
                    statusColor: "text-muted-foreground",
                  },
                  {
                    time: "10:30 AM - 12:00 PM",
                    title: "Advanced Physics & Wave Mechanics",
                    class: "Grade 11 - Section B",
                    room: "Science Lab B",
                    status: "In Session",
                    statusColor: "text-emerald-600 font-bold",
                  },
                  {
                    time: "01:30 PM - 03:00 PM",
                    title: "Algebraic Foundations",
                    class: "Grade 9 - Section C",
                    room: "Room 105",
                    status: "Upcoming",
                    statusColor: "text-blue-600 font-medium",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/20 gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground">{item.time}</span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground pt-1">{item.title}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {item.class} &bull; {item.room}
                      </p>
                    </div>
                    <span className={`text-[11px] self-start sm:self-center ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions / Today's Summary */}
            <div className="space-y-4">
              <Card className="shadow-xs border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <CardTitle className="text-xs font-bold text-foreground">Teacher Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between border-b pb-1.5">
                    <span>Enrolled Classes:</span>
                    <span className="font-bold text-foreground">{classes.length}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span>Campus School:</span>
                    <span className="font-bold text-foreground truncate max-w-32">
                      {"Academic Campus"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Status:</span>
                    <span className="text-emerald-600 font-semibold">Active Faculty</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold">Faculty Office Hours</CardTitle>
                  <CardDescription className="text-[11px]">
                    Drop-in academic tutoring and student office hours.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs space-y-1 text-muted-foreground">
                  <p>• Tuesday &amp; Thursday: 03:30 PM - 04:30 PM</p>
                  <p>• Location: Faculty Staff Room 12</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MY CLASSES ── */}
      {activeTab === "classes" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-lg font-bold tracking-tight">My Teaching Classes</h2>
            <p className="text-xs text-muted-foreground">
              Courses and active grade sections assigned across term curriculum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classes.map((c) => (
              <Card key={c.id} className="shadow-xs">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{c.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Grade {c.gradeLevel} &bull; Academic Year: {c.academicYear}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {c.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-primary" />
                      {c.school?.name || "Campus Unit"}
                    </span>
                    <span className="font-semibold text-emerald-600">Enrolled &amp; Active</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {classes.length === 0 && (
              <div className="col-span-full p-8 text-center text-xs text-muted-foreground border rounded-lg border-dashed">
                No classes assigned to your faculty profile.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: CURRICULUM ── */}
      {activeTab === "curriculum" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Curriculum &amp; Syllabi</h2>
            <p className="text-xs text-muted-foreground">
              Core academic syllabus guidelines and course codes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {subjects.map((s) => (
              <Card key={s.id} className="shadow-xs">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/10">
                      {s.code}
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase">
                      {s.status}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground">{s.name}</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Approved department subject
                  </p>
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
