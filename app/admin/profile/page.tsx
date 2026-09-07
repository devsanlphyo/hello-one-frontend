"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Building2,
  Calendar,
  Camera,
  Clock,
  Globe,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { fetchMyDevices, removeMyAvatar, uploadMyAvatar } from "@/lib/api/users";
import { UserDeviceItem } from "@/lib/api/devices";
import { getDeviceName, getOrCreateDeviceId } from "@/lib/device";

export default function AdminProfilePage() {
  const { user, role, isLoading, logout, updateUserAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Devices state
  const [devices, setDevices] = useState<UserDeviceItem[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState("");
  const [currentDeviceName, setCurrentDeviceName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentDeviceId(getOrCreateDeviceId());
      setCurrentDeviceName(getDeviceName());
    }
  }, []);

  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const res = await fetchMyDevices();
      if (res.isSuccess && Array.isArray(res.devices)) {
        setDevices(res.devices);
      }
    } catch {
      // ignore
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDevices();
    }
  }, [user]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Unsupported file type. Please upload a JPG, PNG, or WEBP image.",
      );
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

  return (
    <SidebarProvider>
      <AdminSidebar current="profile" />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/users">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 md:p-6 flex-1">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Administrator Profile
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    View and manage your personal credentials, avatar, and
                    administrative portal privileges.
                  </p>
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={logout}
                className="gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-pulse text-sm text-muted-foreground">
                  Loading administrator details...
                </div>
              </div>
            ) : user ? (
              <div className="space-y-6">
                {/* Account Summary Card */}
                <Card className="shadow-xs">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-5 border-b">
                    {/* Avatar Upload Trigger */}
                    <div className="relative group">
                      <Avatar className="size-20 border-2 border-primary/20 shadow-xs">
                        <AvatarImage
                          src={user.avatarUrl || undefined}
                          alt={user.fullName}
                        />
                        <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                          {user.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Hover Overlay Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        aria-label="Upload photo"
                        className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Camera className="h-5 w-5" />
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

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-xl">
                          {user.fullName}
                        </CardTitle>
                        <Badge
                          variant="default"
                          className="uppercase text-xs font-semibold"
                        >
                          {user.role}
                        </Badge>
                        <Badge
                          variant={
                            user.status === "active" ? "outline" : "destructive"
                          }
                          className="capitalize text-[11px]"
                        >
                          {user.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground mt-1">
                        System Administrator Account &bull; ID: {user.id}
                      </CardDescription>

                      {/* Photo management buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="h-7 text-xs gap-1.5"
                        >
                          {isUploading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {user.avatarUrl ? "Change Photo" : "Upload Photo"}
                          </span>
                        </Button>

                        {user.avatarUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isUploading}
                            onClick={handleRemoveAvatar}
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </Button>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          JPG, PNG, WEBP (Standard max 10MB)
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border bg-card/60 p-3.5 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span>Email Address</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {user.email}
                        </p>
                      </div>

                      <div className="rounded-lg border bg-card/60 p-3.5 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Administrative Tier</span>
                        </div>
                        <p className="text-sm font-semibold capitalize text-foreground">
                          {user.role} (Elevated Privileges)
                        </p>
                      </div>

                      <div className="rounded-lg border bg-card/60 p-3.5 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Assigned School Scope</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {user.schoolId
                            ? `School ID: ${user.schoolId}`
                            : "All Schools (District/Global)"}
                        </p>
                      </div>

                      <div className="rounded-lg border bg-card/60 p-3.5 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <KeyRound className="h-3.5 w-3.5" />
                          <span>Session Security</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          HTTP-only Cookie (Lax, 7-Day Session)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Scope & Access Permissions */}
                <Card className="shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Administrative Permissions &amp; Scope
                    </CardTitle>
                    <CardDescription className="text-xs">
                      The modules and actions permitted by your administrative
                      role in this portal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-foreground">
                          User Management:
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          Full Control
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-foreground">
                          Schools Management:
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          Full Control
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-foreground">
                          Classes Management:
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          Full Control
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-foreground">
                          Subjects Catalog:
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          Full Control
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-foreground">
                          Platform Settings &amp; Logo:
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          Full Control
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Logged-in Devices Card */}
                <Card className="shadow-xs">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-primary" />
                        Logged-in Devices
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Devices currently or recently authorized to access your administrator account.
                      </CardDescription>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadDevices}
                      disabled={loadingDevices}
                      className="h-8 w-8 p-0"
                      title="Refresh devices"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${loadingDevices ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {loadingDevices ? (
                      <div className="space-y-2">
                        <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
                        <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
                      </div>
                    ) : devices.length === 0 ? (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                            <Laptop className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">
                                {currentDeviceName || "Current Web Browser"}
                              </span>
                              <Badge className="text-[9px] bg-emerald-500 text-white border-0 font-bold px-1.5 py-0 h-4">
                                Current
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              Device ID: {currentDeviceId ? currentDeviceId.slice(0, 16) : "Active"}...
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] text-emerald-600 border-emerald-500/30 font-semibold"
                        >
                          Authorized
                        </Badge>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {devices.map((dev) => {
                          const isCurrent = dev.deviceId === currentDeviceId;
                          const isMobile =
                            dev.deviceName?.toLowerCase().includes("mobile") ||
                            dev.deviceName?.toLowerCase().includes("iphone") ||
                            dev.deviceName?.toLowerCase().includes("android");
                          const DeviceIcon = isMobile ? Smartphone : Laptop;

                          return (
                            <div
                              key={dev.id}
                              className={`rounded-xl border p-3.5 transition-all ${
                                isCurrent
                                  ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                                  : "border-border/80 bg-card hover:bg-muted/20"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                  <div
                                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                      isCurrent
                                        ? "bg-emerald-500/10 text-emerald-600"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    <DeviceIcon className="h-4 w-4" />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-foreground truncate">
                                        {dev.deviceName || "Web Client"}
                                      </span>
                                      {isCurrent && (
                                        <Badge className="text-[9px] bg-emerald-500 text-white border-0 font-bold px-1.5 py-0 h-4">
                                          Current Session
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1 font-mono flex-wrap">
                                      {dev.ipAddress && (
                                        <span className="flex items-center gap-1">
                                          <Globe className="h-2.5 w-2.5" />
                                          {dev.ipAddress}
                                        </span>
                                      )}
                                      <span>&bull;</span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" />
                                        Last Login: {formatDate(dev.lastLoginAt || dev.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {dev.status === "approved" && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-semibold"
                                    >
                                      <ShieldCheck className="h-2.5 w-2.5" />
                                      Approved
                                    </Badge>
                                  )}
                                  {dev.status === "pending" && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/30 gap-1 font-semibold"
                                    >
                                      <ShieldAlert className="h-2.5 w-2.5" />
                                      Pending
                                    </Badge>
                                  )}
                                  {(dev.status === "rejected" || dev.status === "revoked") && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] bg-destructive/10 text-destructive border-destructive/30 font-semibold capitalize"
                                    >
                                      {dev.status}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
