"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarCheck,
  BookOpen,
  Users,
  Clock,
  User as UserIcon,
  Building,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { StaffPortalLayout, NavTabItem } from "@/components/portal/StaffPortalLayout";
import { StaffProfileTab } from "@/components/portal/StaffProfileTab";
import { MonitorAttendanceView } from "@/components/attendance/MonitorAttendanceView";
import { CheckInOutWidget } from "@/components/attendance/CheckInOutWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { fetchClasses, ClassItem } from "@/lib/api/classes";
import { fetchTeachersWithShifts, TeacherWithShift } from "@/lib/api/shifts";

export default function HeadmasterPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("attendance");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherWithShift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadHeadmasterData() {
      setLoading(true);
      try {
        const [clsRes, tchrRes] = await Promise.all([
          fetchClasses(),
          fetchTeachersWithShifts(),
        ]);
        if (clsRes?.isSuccess) setClasses(clsRes.data || []);
        if (Array.isArray(tchrRes)) setTeachers(tchrRes);
      } catch {
        // graceful fallback
      } finally {
        setLoading(false);
      }
    }
    loadHeadmasterData();
  }, []);

  const tabs: NavTabItem[] = [
    { id: "attendance", label: "Monitor Attendances", icon: CalendarCheck },
    { id: "faculty", label: "Faculty & Shifts", icon: Users, badge: teachers.length },
    { id: "classes", label: "Campus Classes", icon: BookOpen, badge: classes.length },
    { id: "checkin", label: "My Check In / Out", icon: Clock },
    { id: "profile", label: "Profile & Workstation", icon: UserIcon },
  ];

  return (
    <StaffPortalLayout
      roleTitle="Headmaster"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── TAB 1: ATTENDANCE MONITORING (Matching Image 2) ── */}
      {activeTab === "attendance" && (
        <MonitorAttendanceView initialSchoolId={user?.schoolId ?? undefined} allowCrossCampus={false} />
      )}

      {/* ── TAB 2: FACULTY & SHIFTS ── */}
      {activeTab === "faculty" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Campus Faculty &amp; Assigned Shifts
            </h2>
            <p className="text-xs text-muted-foreground">
              Academic staff roster and assigned instructional shift periods for this campus.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {teachers.map((t) => (
              <Card key={t.id} className="shadow-xs">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">{t.fullName}</h4>
                      <p className="text-[11px] text-muted-foreground truncate">{t.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-[9px] uppercase shrink-0">
                      {t.status}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Assigned Shift:</span>
                      <span className="font-semibold text-foreground">
                        {t.assignment?.shiftName || "Unassigned"}
                      </span>
                    </div>
                    {t.assignment && (
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span>Hours:</span>
                        <span>
                          {t.assignment.startTime} - {t.assignment.endTime}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {teachers.length === 0 && !loading && (
              <div className="col-span-full p-8 text-center text-xs text-muted-foreground border rounded-lg border-dashed">
                No faculty members registered for this campus yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: CAMPUS CLASSES ── */}
      {activeTab === "classes" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Campus Academic Sections
            </h2>
            <p className="text-xs text-muted-foreground">
              Active classrooms and academic cohorts registered at this school facility.
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
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                      Class Teacher: {c.teacher?.fullName || "Unassigned"}
                    </span>
                    <span className="font-semibold text-emerald-600">Active</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {classes.length === 0 && !loading && (
              <div className="col-span-full p-8 text-center text-xs text-muted-foreground border rounded-lg border-dashed">
                No classes registered under this school.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: HEADMASTER SELF CHECK IN / OUT ── */}
      {activeTab === "checkin" && <CheckInOutWidget />}

      {/* ── TAB 5: PROFILE ── */}
      {activeTab === "profile" && <StaffProfileTab />}
    </StaffPortalLayout>
  );
}
