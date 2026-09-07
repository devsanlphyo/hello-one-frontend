"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Clock,
  Globe,
  Laptop,
  Loader2,
  LogOut,
  Moon,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeviceName, getOrCreateDeviceId } from "@/lib/device";
import {
  fetchMyDevices,
  MyUserDeviceItem,
  signOutDevice,
  signOutOtherDevices,
} from "@/lib/api/users";

const THEME_OPTIONS = [
  {
    key: "light",
    label: "Light",
    Icon: Sun,
    description: "Clean & bright appearance",
  },
  {
    key: "dark",
    label: "Dark",
    Icon: Moon,
    description: "Reduced glare & eye strain",
  },
  {
    key: "system",
    label: "System",
    Icon: Laptop,
    description: "Syncs with device OS theme",
  },
] as const;

export default function SettingsPage() {
  const { user, isLoading, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Logged-in Devices State
  const [devices, setDevices] = useState<MyUserDeviceItem[]>([]);
  const [firstDeviceId, setFirstDeviceId] = useState<string | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState("");
  const [currentDeviceName, setCurrentDeviceName] = useState("");

  // Sign out other devices states
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [signingOutId, setSigningOutId] = useState<string | null>(null);
  const [confirmSignoutOthersOpen, setConfirmSignoutOthersOpen] = useState(false);

  // Hydration safety for next-themes
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
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
        if (res.firstDeviceId) {
          setFirstDeviceId(res.firstDeviceId);
        } else if (res.devices.length > 0) {
          const first = res.devices.find((d) => d.isFirstDevice);
          if (first) setFirstDeviceId(first.deviceId);
        }
      }
    } catch {
      // Fallback gracefully
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

  // Check if the current device is the first registered device
  const isFirstDeviceCurrent = Boolean(
    firstDeviceId && currentDeviceId && firstDeviceId === currentDeviceId,
  );

  // Other active devices that can be signed out
  const otherActiveDevices = devices.filter(
    (d) => d.deviceId !== currentDeviceId && d.status !== "revoked",
  );

  // Handler: Sign out all other devices
  const handleSignOutOtherDevices = async () => {
    try {
      setSigningOutOthers(true);
      const res = await signOutOtherDevices();
      if (res.isSuccess) {
        toast.success(res.message || "All other devices have been signed out.");
        await loadDevices();
      } else {
        toast.error(res.message || "Failed to sign out other devices.");
      }
    } catch (err: any) {
      toast.error(
        err?.message || "Only the first registered device can sign out other devices.",
      );
    } finally {
      setSigningOutOthers(false);
      setConfirmSignoutOthersOpen(false);
    }
  };

  // Handler: Sign out a specific other device
  const handleSignOutSingleDevice = async (
    targetDeviceId: string,
    targetDeviceName?: string | null,
  ) => {
    try {
      setSigningOutId(targetDeviceId);
      const res = await signOutDevice(targetDeviceId);
      if (res.isSuccess) {
        toast.success(
          res.message ||
            `Device "${targetDeviceName || targetDeviceId}" signed out.`,
        );
        await loadDevices();
      } else {
        toast.error(res.message || "Failed to sign out device.");
      }
    } catch (err: any) {
      toast.error(
        err?.message || "Only the first registered device can sign out other devices.",
      );
    } finally {
      setSigningOutId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col antialiased">
        <PortalHeader currentTab="settings" />
        <div className="flex-1 max-w-md mx-auto p-4 w-full flex items-center justify-center">
          <div className="animate-pulse text-xs text-muted-foreground">
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col antialiased">
        <PortalHeader currentTab="settings" />
        <div className="flex-1 max-w-md mx-auto p-4 w-full flex items-center justify-center">
          <Card className="w-full text-center p-6 shadow-sm">
            <h2 className="text-base font-bold mb-1">Session Expired</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Please sign in to configure your settings.
            </p>
            <Link
              href="/auth/login"
              className={buttonVariants({ className: "w-full text-xs h-9" })}
            >
              Sign In
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col antialiased">
      {/* Tier 1 (Brand Only) & Tier 2 (Nav Link Icons Only) */}
      <PortalHeader currentTab="settings" />

      {/* ─────────────────────────────────────────────────────────────
          TIER 3: MAIN CONTENTS SECTION
          Dedicated Settings Page: Theme Switching & Logged-in Devices
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-4 pb-20 animate-in fade-in-50 duration-200">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Settings &amp; Preferences
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure appearance theme and inspect active account devices.
          </p>
        </div>

        {/* ── CARD 1: THEME MODES SWITCHING ── */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="p-4 pb-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Appearance &amp; Theme
            </CardTitle>
            <CardDescription className="text-xs">
              Select your preferred display theme mode for this device.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-1.5 space-y-3">
            {!mounted ? (
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ key, label, Icon, description }) => {
                  const isActive = theme === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTheme(key)}
                      className={`relative flex flex-col items-center justify-between p-3 rounded-xl border-2 text-center transition-all touch-manipulation focus:outline-none ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40 active:scale-95"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="mt-2 min-w-0">
                        <p
                          className={`text-xs font-semibold ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {label}
                        </p>
                        <p className="text-[9px] text-muted-foreground leading-tight hidden sm:block mt-0.5">
                          {description}
                        </p>
                      </div>

                      {isActive && (
                        <Badge className="mt-2 text-[8px] py-0 px-1.5 h-4 bg-primary text-primary-foreground border-0 font-semibold">
                          Active
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {mounted && theme === "system" && (
              <p className="text-center text-[10px] text-muted-foreground pt-1">
                System mode resolves to{" "}
                <span className="font-semibold text-foreground capitalize">
                  {resolvedTheme}
                </span>{" "}
                based on your operating system.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── CARD 2: LOGGED-IN DEVICES & SIGN OUT OTHER DEVICES ── */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="p-4 pb-2.5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Laptop className="h-4 w-4 text-primary" />
                Logged-in Devices
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                All devices currently or recently authorized to your account.
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadDevices}
              disabled={loadingDevices}
              className="h-8 w-8 p-0 shrink-0"
              title="Refresh devices"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingDevices ? "animate-spin" : ""}`}
              />
            </Button>
          </CardHeader>

          <CardContent className="p-4 pt-1 space-y-3">
            {/* First-device restriction alert or action */}
            {!loadingDevices && devices.length > 0 && (
              <>
                {isFirstDeviceCurrent ? (
                  /* User IS on the first device */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 text-xs">
                      <Shield className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <span className="font-bold text-foreground">Primary Device</span>
                        <p className="text-[10px] text-muted-foreground">
                          You can sign out other devices from this device.
                        </p>
                      </div>
                    </div>

                    {otherActiveDevices.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmSignoutOthersOpen(true)}
                        disabled={signingOutOthers}
                        className="h-7 text-xs gap-1.5 shrink-0 self-start sm:self-auto"
                      >
                        {signingOutOthers ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <LogOut className="h-3 w-3" />
                        )}
                        Sign Out Others ({otherActiveDevices.length})
                      </Button>
                    )}
                  </div>
                ) : (
                  /* User is NOT on the first device */
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-xs">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                    <span className="text-[11px] leading-tight">
                      <strong>Sign-out restriction:</strong> Signing out other devices can only be performed from your <strong>first registered device</strong>.
                    </span>
                  </div>
                )}
              </>
            )}

            {loadingDevices ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : devices.length === 0 ? (
              /* Fallback active device */
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Laptop className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground">
                          {currentDeviceName || "Current Web Browser"}
                        </span>
                        <Badge className="text-[9px] bg-emerald-500 text-white border-0 font-bold px-1.5 py-0 h-4">
                          Current
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        ID: {currentDeviceId ? currentDeviceId.slice(0, 16) : "Active"}...
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
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((dev) => {
                  const isCurrent = dev.deviceId === currentDeviceId;
                  const isFirst = dev.deviceId === firstDeviceId || dev.isFirstDevice;
                  const isRevoked = dev.status === "revoked" || dev.status === "rejected";
                  const isMobile =
                    dev.deviceName?.toLowerCase().includes("mobile") ||
                    dev.deviceName?.toLowerCase().includes("iphone") ||
                    dev.deviceName?.toLowerCase().includes("android");
                  const DeviceIcon = isMobile ? Smartphone : Laptop;

                  return (
                    <div
                      key={dev.id}
                      className={`rounded-xl border p-3 transition-all ${
                        isCurrent
                          ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                          : isRevoked
                          ? "border-border/50 bg-muted/20 opacity-70"
                          : "border-border/80 bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                              isCurrent
                                ? "bg-emerald-500/10 text-emerald-600"
                                : isRevoked
                                ? "bg-muted text-muted-foreground/50"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <DeviceIcon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-foreground truncate">
                                {dev.deviceName || "Web Client"}
                              </span>
                              {isCurrent && (
                                <Badge className="text-[9px] bg-emerald-500 text-white border-0 font-bold px-1.5 py-0 h-4">
                                  Current
                                </Badge>
                              )}
                              {isFirst && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] bg-primary/10 text-primary border-primary/30 font-semibold px-1.5 py-0 h-4 gap-1"
                                >
                                  <Shield className="h-2.5 w-2.5" />
                                  1st Device
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 font-mono flex-wrap">
                              {dev.ipAddress && (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-2.5 w-2.5" />
                                  {dev.ipAddress}
                                </span>
                              )}
                              <span>&bull;</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDate(dev.lastLoginAt || dev.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
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
                          {isRevoked && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-destructive/10 text-destructive border-destructive/30 font-semibold capitalize"
                            >
                              {dev.status}
                            </Badge>
                          )}

                          {/* Individual sign out button if caller is on the 1st device and device is not current and not already revoked */}
                          {isFirstDeviceCurrent && !isCurrent && !isRevoked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={signingOutId === dev.deviceId}
                              onClick={() =>
                                handleSignOutSingleDevice(dev.deviceId, dev.deviceName)
                              }
                              className="h-6 px-1.5 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 font-medium"
                            >
                              {signingOutId === dev.deviceId ? (
                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              ) : (
                                <LogOut className="h-2.5 w-2.5" />
                              )}
                              Sign out
                            </Button>
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

        {/* ── CARD 3: ACCOUNT & SESSION ACTIONS ── */}
        <Card className="shadow-xs border-destructive/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                Sign Out of Portal
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                End your active authenticated session on this device.
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={logout}
              className="text-xs h-8 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Dialog: Sign Out Other Devices */}
      <AlertDialog
        open={confirmSignoutOthersOpen}
        onOpenChange={setConfirmSignoutOthersOpen}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <LogOut className="h-4 w-4 text-destructive" />
              Sign Out All Other Devices?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2">
              <p>
                This action will immediately terminate active sessions on all{" "}
                <strong>{otherActiveDevices.length}</strong> other device(s)
                connected to your account.
              </p>
              <p className="text-muted-foreground">
                Your current session on this primary device will remain active.
                Revoked devices will require administrative approval to sign in
                again.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={signingOutOthers}
              className="text-xs h-8"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOutOtherDevices}
              disabled={signingOutOthers}
              className="text-xs h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {signingOutOthers ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              Sign Out Others
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
