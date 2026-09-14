"use client";

import React, { useEffect, useState } from "react";
import {
  ListTodo,
  BookOpen,
  User as UserIcon,
  Clock,
  CheckCircle2,
  Building,
  CalendarRange,
  MessageSquare,
} from "lucide-react";
import { StaffPortalLayout, NavTabItem } from "@/components/portal/StaffPortalLayout";
import { StaffProfileTab } from "@/components/portal/StaffProfileTab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { fetchClasses, ClassItem } from "@/lib/api/classes";
import { CheckInOutWidget } from "@/components/attendance/CheckInOutWidget";
import { StaffLeaveRequestView } from "@/components/leaves/StaffLeaveRequestView";
import { FeedView } from "@/components/feed/FeedView";

export default function AssistantPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("feed");
  const [classes, setClasses] = useState<ClassItem[]>([]);

  useEffect(() => {
    async function loadAssistantData() {
      try {
        const clsRes = await fetchClasses();
        if (clsRes?.isSuccess) setClasses(clsRes.data || []);
      } catch {
        // fallback
      }
    }
    loadAssistantData();
  }, []);

  const tabs: NavTabItem[] = [
    { id: "feed", label: "Campus Feed", icon: MessageSquare },
    { id: "attendance", label: "Check In / Out", icon: Clock },
    { id: "leaves", label: "Leave Requests", icon: CalendarRange },
    { id: "tasks", label: "Daily Support Tasks", icon: ListTodo },
    { id: "classes", label: "Assigned Classes", icon: BookOpen, badge: classes.length },
    { id: "profile", label: "Profile & Workstation", icon: UserIcon },
  ];

  return (
    <StaffPortalLayout
      roleTitle="Assistant"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── TAB: CAMPUS FEED ── */}
      {activeTab === "feed" && <FeedView />}

      {/* ── TAB: CHECK IN / CHECK OUT ── */}
      {activeTab === "attendance" && <CheckInOutWidget />}

      {/* ── TAB: LEAVE REQUESTS ── */}
      {activeTab === "leaves" && <StaffLeaveRequestView />}

      {/* ── TAB 1: DAILY SUPPORT TASKS ── */}
      {activeTab === "tasks" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Academic Support Desk</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Welcome back, Assistant {user?.fullName}. Here are your daily educational support responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="shadow-xs border-l-4 border-l-cyan-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Assigned Classes
                </span>
                <div className="text-2xl font-bold">{classes.length}</div>
                <p className="text-[10px] text-muted-foreground">Classroom sessions supported</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-emerald-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Today's Tasks
                </span>
                <div className="text-2xl font-bold">4 Completed</div>
                <p className="text-[10px] text-muted-foreground">2 pending review</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-blue-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Faculty Lead
                </span>
                <div className="text-sm font-bold text-foreground mt-1.5 truncate">
                  Dept of Sciences
                </div>
                <p className="text-[10px] text-muted-foreground">Academic department</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-purple-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </span>
                <div className="text-sm font-bold text-emerald-600 mt-1.5">
                  Available On-Duty
                </div>
                <p className="text-[10px] text-muted-foreground">Campus Staff Pool</p>
              </CardContent>
            </Card>
          </div>

          {/* Support Tasks Checklist */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Assigned Support Duties</CardTitle>
              <CardDescription className="text-xs">
                Classroom preparation, laboratory setup, and administrative assistance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { task: "Prepare laboratory apparatus for Grade 11 Physics (Science Lab B)", done: true, time: "08:15 AM" },
                { task: "Print student test worksheets for Mathematics Section A", done: true, time: "09:30 AM" },
                { task: "Log student participation notes for Grade 10 Section B", done: true, time: "11:00 AM" },
                { task: "Assist primary instructor with afternoon tutoring hall setup", done: false, time: "02:00 PM" },
                { task: "Inventory classroom supplies & submit replenishment sheet", done: false, time: "04:30 PM" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs">
                  <div className="flex items-center gap-2.5">
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={item.done ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {item.task}
                    </span>
                  </div>
                  <Badge variant={item.done ? "outline" : "secondary"} className="text-[10px]">
                    {item.time}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 2: ASSIGNED CLASSES ── */}
      {activeTab === "classes" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Assigned Support Classes</h2>
            <p className="text-xs text-muted-foreground">
              Educational sections where you provide teacher support and student assistance.
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
                      {c.school?.name || "Campus"}
                    </span>
                    <span className="font-semibold text-cyan-600">Assistant Assigned</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {classes.length === 0 && (
              <div className="col-span-full p-8 text-center text-xs text-muted-foreground border rounded-lg border-dashed">
                No classes assigned yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: PROFILE & WORKSTATION ── */}
      {activeTab === "profile" && <StaffProfileTab />}
    </StaffPortalLayout>
  );
}
