"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookMarked,
  BookOpen,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Laptop,
  LayoutDashboard,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { getDeviceName, getOrCreateDeviceId } from "@/lib/device";

const ADMIN_ROLES = new Set(["admin", "director", "headmaster"]);

type MobileTab = "profile" | "classes" | "subjects" | "schedule" | "device";

export default function ProfilePage() {
  const { user, role, isLoading, logout } = useAuth();
  const { logoUrl } = useAppSettings();
  const [activeTab, setActiveTab] = useState<MobileTab>("profile");

  const deviceName = typeof window !== "undefined" ? getDeviceName() : "Web Client";
  const deviceId = typeof window !== "undefined" ? getOrCreateDeviceId() : "";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground text-sm">
          Loading portal...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full text-center p-6 shadow-md">
          <GraduationCap className="h-10 w-10 text-primary mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Session Expired</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Please sign in to access your staff portal.
          </p>
          <Link href="/auth/login" className={buttonVariants({ className: "w-full text-xs h-9" })}>
            Go to Login
          </Link>
        </Card>
      </div>
    );
  }

  const isAdmin = ADMIN_ROLES.has((role || "").toLowerCase());

  const navItems: { key: MobileTab; label: string; icon: typeof UserIcon; badge?: string }[] = [
    { key: "profile", label: "My Profile", icon: UserIcon },
    { key: "classes", label: "My Classes", icon: BookOpen, badge: "2" },
    { key: "subjects", label: "Subjects", icon: BookMarked },
    { key: "schedule", label: "Schedule", icon: CalendarCheck },
    { key: "device", label: "This Device", icon: Laptop },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col antialiased">
      {/* ─────────────────────────────────────────────────────────────
          TIER 1: TOP BRAND-ONLY HEADER (No Sidebars)
          Fixed / Sticky top brand header for clean mobile-first view
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <GraduationCap className="h-4 w-4" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground">
                School OS
              </span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">
                Staff &amp; Faculty Portal
              </span>
            </div>
          </div>

          {/* Quick Right Actions */}
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <Link
                href="/admin/users"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "h-8 px-2 text-xs text-primary hover:bg-primary/10 gap-1",
                })}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          TIER 2: NAV LINK ICONS BAR (Directly Below Brand)
          Touch-friendly, horizontal scrollable icon navigation
      ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-14 z-30 w-full border-b bg-card/95 backdrop-blur-sm shadow-2xs">
        <div className="max-w-xl mx-auto px-2 py-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all select-none touch-manipulation ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold scale-[1.02]"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0 rounded-full font-bold leading-none ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          TIER 3: MAIN CONTENTS SECTION (Directly Below Nav Links)
          Responsive mobile-tailored content cards with rich design
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-xl mx-auto p-4 space-y-4 pb-20">
        {/* ── TAB 1: PROFILE CONTENT ── */}
        {activeTab === "profile" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* User Profile Hero Card */}
            <Card className="shadow-xs overflow-hidden border-border/80">
              <div className="h-16 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
              <CardHeader className="-mt-8 pb-3 px-4 flex flex-row items-end gap-3.5">
                <Avatar className="size-16 border-4 border-card shadow-sm shrink-0">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName} />
                  <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                    {user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-foreground truncate">
                      {user.fullName}
                    </h2>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold text-primary border-primary/30 bg-primary/5">
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </CardHeader>

              <CardContent className="px-4 pt-1 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Account Status
                    </span>
                    <div className="flex items-center gap-1.5 font-semibold capitalize text-foreground">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {user.status}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Campus School
                    </span>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                      <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">Central Campus</span>
                    </div>
                  </div>
                </div>

                {/* Quick Info Box */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Email Address</span>
                    <span className="font-medium text-foreground">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>User Role</span>
                    <span className="font-medium capitalize text-foreground">{user.role}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Device Authorization</span>
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-semibold">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      Authorized
                    </Badge>
                  </div>
                </div>
              </CardContent>

              {isAdmin && (
                <CardFooter className="px-4 py-3 bg-muted/20 border-t flex justify-between">
                  <span className="text-xs text-muted-foreground">You have administrator access</span>
                  <Link
                    href="/admin/users"
                    className={buttonVariants({ variant: "default", size: "sm", className: "text-xs h-7 gap-1" })}
                  >
                    Open Admin Portal
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </CardFooter>
              )}
            </Card>
          </div>
        )}

        {/* ── TAB 2: MY CLASSES DEMO CONTENT ── */}
        {activeTab === "classes" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assigned Classes (Term 1)
              </h3>
              <Badge variant="secondary" className="text-[10px]">2 Classes</Badge>
            </div>

            {[
              { name: "Grade 10 - Mathematics A", room: "Room 204", students: 28, time: "08:30 AM - 10:00 AM" },
              { name: "Grade 11 - Advanced Physics", room: "Science Lab B", students: 24, time: "10:30 AM - 12:00 PM" },
            ].map((cls, i) => (
              <Card key={i} className="shadow-xs hover:border-primary/40 transition-colors">
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{cls.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{cls.room} &bull; {cls.students} enrolled students</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 font-medium">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
                    <Clock className="h-3 w-3 text-primary" />
                    <span>{cls.time}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── TAB 3: SUBJECTS DEMO CONTENT ── */}
        {activeTab === "subjects" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Curriculum &amp; Subjects
            </h3>

            {[
              { code: "MATH-101", title: "Algebra & Geometry", grade: "Secondary 3" },
              { code: "PHYS-201", title: "Mechanics & Wave Dynamics", grade: "Secondary 4" },
            ].map((sub, i) => (
              <Card key={i} className="shadow-xs">
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-primary font-bold">{sub.code}</span>
                    <h4 className="text-xs font-semibold text-foreground">{sub.title}</h4>
                    <p className="text-[10px] text-muted-foreground">{sub.grade}</p>
                  </div>
                  <BookMarked className="h-5 w-5 text-muted-foreground/40" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── TAB 4: SCHEDULE DEMO CONTENT ── */}
        {activeTab === "schedule" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Today's Timetable
            </h3>

            <Card className="shadow-xs">
              <CardContent className="p-3.5 space-y-3">
                <div className="flex items-center gap-3 border-l-2 border-primary pl-3 py-1">
                  <div className="text-xs font-bold w-16">08:30 AM</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">Mathematics A (Grade 10)</p>
                    <p className="text-[10px] text-muted-foreground">Room 204 &bull; In Session</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-l-2 border-muted pl-3 py-1 text-muted-foreground">
                  <div className="text-xs font-bold w-16">10:30 AM</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Advanced Physics (Grade 11)</p>
                    <p className="text-[10px]">Science Lab B &bull; Upcoming</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-l-2 border-muted pl-3 py-1 text-muted-foreground">
                  <div className="text-xs font-bold w-16">02:00 PM</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Faculty Staff Assembly</p>
                    <p className="text-[10px]">Main Auditorium</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── TAB 5: THIS DEVICE (Security / Device Approval Link) ── */}
        {activeTab === "device" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Authorized Device Status
            </h3>

            <Card className="shadow-xs border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-foreground truncate">{deviceName}</h4>
                      <Badge className="text-[9px] bg-emerald-500 text-white border-0 font-bold">
                        Approved
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                      ID: {deviceId}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border bg-background/80 p-2.5 text-[11px] text-muted-foreground space-y-1">
                  <p>
                    This device was verified and authorized by a school administrator. You can sign in smoothly from this browser without repeated approval requests.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
