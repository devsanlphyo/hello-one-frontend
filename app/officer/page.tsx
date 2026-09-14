"use client";

import React, { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Laptop,
  Users,
  ShieldCheck,
  Building,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarRange,
  MessageSquare,
} from "lucide-react";
import { StaffPortalLayout, NavTabItem } from "@/components/portal/StaffPortalLayout";
import { StaffProfileTab } from "@/components/portal/StaffProfileTab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { fetchDevices, UserDeviceItem } from "@/lib/api/devices";
import { CheckInOutWidget } from "@/components/attendance/CheckInOutWidget";
import { StaffLeaveRequestView } from "@/components/leaves/StaffLeaveRequestView";
import { FeedView } from "@/components/feed/FeedView";

export default function OfficerPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("feed");
  const [devices, setDevices] = useState<UserDeviceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadOfficerData() {
      setLoading(true);
      try {
        const devRes = await fetchDevices();
        if (devRes?.isSuccess) setDevices(devRes.items || []);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    loadOfficerData();
  }, []);

  const tabs: NavTabItem[] = [
    { id: "feed", label: "Campus Feed", icon: MessageSquare },
    { id: "attendance", label: "Check In / Out", icon: Clock },
    { id: "leaves", label: "Leave Requests", icon: CalendarRange },
    { id: "operations", label: "Campus Operations", icon: ClipboardCheck },
    { id: "devices", label: "Workstation Devices", icon: Laptop, badge: devices.length },
    { id: "records", label: "Records & Logistics", icon: ShieldCheck },
    { id: "profile", label: "Profile & Workstation", icon: User },
  ];

  return (
    <StaffPortalLayout
      roleTitle="Officer"
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

      {/* ── TAB 1: CAMPUS OPERATIONS ── */}
      {activeTab === "operations" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Administrative Operations</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Welcome back, Officer {user?.fullName}. Daily operational tracking and facility readiness.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="shadow-xs border-l-4 border-l-amber-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Campus Facilities
                </span>
                <div className="text-2xl font-bold">All Normal</div>
                <p className="text-[10px] text-muted-foreground">Power, network, classrooms ready</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-blue-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Active Devices
                </span>
                <div className="text-2xl font-bold">{devices.length}</div>
                <p className="text-[10px] text-muted-foreground">Registered campus terminals</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-emerald-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Operational Safety
                </span>
                <div className="text-sm font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Secure &bull; Cleared</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Campus perimeter inspected</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-purple-500">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Staff Shift
                </span>
                <div className="text-sm font-bold text-purple-600 mt-1.5">
                  Day Operational Shift
                </div>
                <p className="text-[10px] text-muted-foreground">08:00 AM - 05:00 PM</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Checklist */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Daily Operational Protocol</CardTitle>
              <CardDescription className="text-xs">
                Essential duties and verification logs for today's shift.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { task: "Morning classroom and laboratory access unlocking", done: true, time: "07:30 AM" },
                { task: "Campus visitor log & security reception check-in verification", done: true, time: "08:15 AM" },
                { task: "Verify computer laboratory hardware and terminal network connectivity", done: true, time: "09:00 AM" },
                { task: "Afternoon perimeter review and library attendance audit", done: false, time: "01:30 PM" },
                { task: "Evening lockup and power-down protocol", done: false, time: "05:00 PM" },
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

      {/* ── TAB 2: WORKSTATION DEVICES ── */}
      {activeTab === "devices" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Campus Workstation Hardware</h2>
            <p className="text-xs text-muted-foreground">
              Hardware terminals and authorized workstations operating on school networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {devices.slice(0, 20).map((d) => (
              <Card key={d.id} className="shadow-xs">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-primary shrink-0" />
                      <h4 className="text-xs font-bold text-foreground truncate">{d.deviceName}</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      User: {d.user?.fullName || "Staff Member"} &bull; {d.user?.role || "Staff"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Last Active: {d.lastLoginAt ? new Date(d.lastLoginAt).toLocaleDateString() : "Recently"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase shrink-0 ${
                      d.status === "approved"
                        ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                        : "text-amber-600 border-amber-500/30 bg-amber-500/10"
                    }`}
                  >
                    {d.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {devices.length === 0 && (
              <div className="col-span-full p-8 text-center text-xs text-muted-foreground border rounded-lg border-dashed">
                No active device sessions registered.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: RECORDS & LOGISTICS ── */}
      {activeTab === "records" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Records &amp; Facility Logistics</h2>
            <p className="text-xs text-muted-foreground">
              Campus supplies, facility logs, and administrative registries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold">Facility Access Keys</CardTitle>
                <CardDescription className="text-[11px]">
                  Master key distribution and laboratory access controls.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <div className="flex justify-between border-b pb-1.5">
                  <span>Science Labs A/B:</span>
                  <span className="font-semibold text-foreground">Assigned to Dept Head</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span>Auditorium &amp; Gymnasium:</span>
                  <span className="font-semibold text-foreground">Available on Request</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Library Annex:</span>
                  <span className="font-semibold text-foreground">Open Access (08:00 - 18:00)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold">Emergency &amp; First Aid Readiness</CardTitle>
                <CardDescription className="text-[11px]">
                  Campus medical stations and emergency exits.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <div className="flex justify-between border-b pb-1.5">
                  <span>Infirmary Station:</span>
                  <span className="font-semibold text-emerald-600">Nurse On-Duty</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span>Fire Extinguishers &amp; Alarms:</span>
                  <span className="font-semibold text-emerald-600">Inspected Aug 2026</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Emergency Assembly Point:</span>
                  <span className="font-semibold text-foreground">Sports Field North</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 4: PROFILE & WORKSTATION ── */}
      {activeTab === "profile" && <StaffProfileTab />}
    </StaffPortalLayout>
  );
}
