"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PortalHeader } from "@/components/portal/PortalHeader";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  CalendarCheck,
  Camera,
  ChevronRight,
  Clock,
  GraduationCap,
  Laptop,
  LayoutDashboard,
  Loader2,
  Mail,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { removeMyAvatar, uploadMyAvatar } from "@/lib/api/users";
import { getDeviceName } from "@/lib/device";

const ADMIN_ROLES = new Set(["admin", "director", "headmaster"]);

function ProfileContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const { user, role, isLoading, updateUserAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentDeviceName, setCurrentDeviceName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentDeviceName(getDeviceName());
    }
  }, []);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image file size exceeds 10MB standard limit.");
      e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadMyAvatar(file);
      if (res.isSuccess) {
        updateUserAvatar(res.user.avatarUrl ?? null);
        toast.success("Profile photo updated successfully");
      } else {
        toast.error(res.message || "Failed to upload profile photo");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload profile photo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true);
      const res = await removeMyAvatar();
      if (res.isSuccess) {
        updateUserAvatar(null);
        toast.success("Profile photo removed");
      } else {
        toast.error(res.message || "Failed to remove profile photo");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove profile photo");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col antialiased">
        <PortalHeader currentTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 max-w-md mx-auto p-4 w-full flex items-center justify-center">
          <div className="animate-pulse text-xs text-muted-foreground">
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col antialiased">
        <PortalHeader currentTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 max-w-md mx-auto p-4 w-full flex items-center justify-center">
          <Card className="w-full text-center p-6 shadow-sm">
            <GraduationCap className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="text-base font-bold mb-1">Session Expired</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Please sign in to access your portal.
            </p>
            <Link href="/auth/login" className={buttonVariants({ className: "w-full text-xs h-9" })}>
              Sign In
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const isAdmin = ADMIN_ROLES.has((role || "").toLowerCase());

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col antialiased">
      {/* Tier 1 (Brand Only) & Tier 2 (Nav Link Icons Only) */}
      <PortalHeader currentTab={activeTab} onTabChange={setActiveTab} />

      {/* ─────────────────────────────────────────────────────────────
          TIER 3: MAIN CONTENTS SECTION
          Top-down flow for mobile users
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-4 pb-20 animate-in fade-in-50 duration-200">
        {/* ── VIEW 1: PROFILE ── */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <Card className="shadow-xs overflow-hidden border-border/80">
              <div className="h-16 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent" />
              <CardHeader className="-mt-8 pb-3 px-4 flex flex-row items-end gap-3.5">
                <div className="relative group shrink-0">
                  <Avatar className="size-16 border-4 border-card shadow-sm">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName} />
                    <AvatarFallback className="text-base font-bold bg-primary text-primary-foreground">
                      {user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    aria-label="Upload avatar photo"
                    className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarSelect}
                  />
                </div>

                <div className="flex-1 min-w-0 pb-0.5">
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
                {/* Avatar Photo actions */}
                <div className="flex items-center gap-2 pb-1 border-b text-xs">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-[11px] gap-1 px-2.5"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    <span>{user.avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                  </Button>

                  {user.avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isUploading}
                      onClick={handleRemoveAvatar}
                      className="h-7 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remove</span>
                    </Button>
                  )}

                  <span className="text-[10px] text-muted-foreground ml-auto">
                    Max 10MB
                  </span>
                </div>

                {/* Account Details Badges */}
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
                      Assigned Campus
                    </span>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                      <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">Central Campus</span>
                    </div>
                  </div>
                </div>

                {/* Info summary */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </span>
                    <span className="font-medium text-foreground">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" /> Role Access
                    </span>
                    <span className="font-medium capitalize text-foreground">{user.role}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Laptop className="h-3.5 w-3.5" /> Device
                    </span>
                    <span className="font-medium text-foreground truncate max-w-44">
                      {currentDeviceName || "Current Browser"}
                    </span>
                  </div>
                </div>

                {/* Quick Link to Settings for Theme & Devices */}
                <Link
                  href="/settings"
                  className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Laptop className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Theme &amp; Logged-in Devices
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Switch appearance mode or inspect active devices
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              </CardContent>

              {isAdmin && (
                <CardFooter className="px-4 py-3 bg-muted/20 border-t flex justify-between">
                  <span className="text-xs text-muted-foreground">Admin privileges active</span>
                  <Link
                    href="/admin/users"
                    className={buttonVariants({ variant: "default", size: "sm", className: "text-xs h-7 gap-1" })}
                  >
                    <LayoutDashboard className="h-3 w-3" />
                    Admin Portal
                  </Link>
                </CardFooter>
              )}
            </Card>
          </div>
        )}

        {/* ── VIEW 2: CLASSES ── */}
        {activeTab === "classes" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assigned Classes
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

        {/* ── VIEW 3: SCHEDULE ── */}
        {activeTab === "schedule" && (
          <div className="space-y-3">
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
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted/20 flex flex-col antialiased">
          <PortalHeader currentTab="profile" />
          <div className="flex-1 max-w-md mx-auto p-4 w-full flex items-center justify-center">
            <div className="animate-pulse text-xs text-muted-foreground">
              Loading profile...
            </div>
          </div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

