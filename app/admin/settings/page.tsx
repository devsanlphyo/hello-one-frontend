"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ImageOff,
  Laptop,
  Lock,
  Moon,
  Save,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAppSettings } from "@/context/AppSettingsContext";
import {
  fetchSettings,
  removeLogo,
  updateSecuritySettings,
  uploadLogo,
} from "@/lib/api/settings";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const AVAILABLE_ROLES = [
  { key: "admin", label: "Admin", desc: "Always bypassed for system administrators", required: true },
  { key: "director", label: "Director", desc: "School executive & director leadership", required: false },
  { key: "headmaster", label: "Headmaster", desc: "Academic head & campus supervisors", required: false },
  { key: "officer", label: "Officer", desc: "Administrative staff & admissions", required: false },
  { key: "teacher", label: "Teacher", desc: "Classroom instructors & educators", required: false },
  { key: "assistant", label: "Assistant", desc: "Teaching assistants & support staff", required: false },
];

const THEME_OPTIONS = [
  {
    key: "light",
    label: "Light",
    Icon: Sun,
    description: "Clean bright interface",
  },
  {
    key: "dark",
    label: "Dark",
    Icon: Moon,
    description: "Easy on the eyes",
  },
  {
    key: "system",
    label: "System",
    Icon: Laptop,
    description: "Follows your OS setting",
  },
] as const;

export default function SettingsPage() {
  const { logoUrl, refreshSettings } = useAppSettings();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // ── Logo upload state ──────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Security & Login Approvals state ──────────────────────────────
  const [requireDeviceApproval, setRequireDeviceApproval] = useState<boolean>(true);
  const [bypassRoles, setBypassRoles] = useState<string[]>(["admin"]);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [securityLoaded, setSecurityLoaded] = useState(false);

  // Theme hydration guard — next-themes resolves after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Load security settings from backend
    const loadSettings = async () => {
      try {
        const res = await fetchSettings();
        if (res.isSuccess && res.data) {
          if (typeof res.data.requireDeviceApproval === "boolean") {
            setRequireDeviceApproval(res.data.requireDeviceApproval);
          }
          if (Array.isArray(res.data.bypassApprovalRoles)) {
            setBypassRoles(res.data.bypassApprovalRoles);
          }
        }
      } catch {
        // fallback to defaults
      } finally {
        setSecurityLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // Cleanup blob preview URLs on unmount / file change
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validateAndSetFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(`Unsupported format. Accepted: JPG, PNG, WEBP, SVG.`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`File too large. Maximum size is 2 MB.`);
      return;
    }
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
    // Reset input so the same file can be re-selected if needed
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const res = await uploadLogo(selectedFile);
      if (res.isSuccess) {
        toast.success(res.message || "Logo updated successfully");
        await refreshSettings();
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmRemove = async () => {
    setRemoving(true);
    setRemoveConfirmOpen(false);
    try {
      const res = await removeLogo();
      if (res.isSuccess) {
        toast.success(res.message || "Logo removed");
        await refreshSettings();
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to remove logo");
    } finally {
      setRemoving(false);
    }
  };

  const cancelSelection = () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleToggleRoleBypass = (roleKey: string) => {
    if (roleKey === "admin") return;
    setBypassRoles((prev) =>
      prev.includes(roleKey)
        ? prev.filter((r) => r !== roleKey)
        : [...prev, roleKey],
    );
  };

  const handleSaveSecurity = async () => {
    setSavingSecurity(true);
    try {
      const res = await updateSecuritySettings({
        requireDeviceApproval,
        bypassApprovalRoles: bypassRoles,
      });
      if (res.isSuccess) {
        toast.success(res.message || "Security settings updated successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update security settings");
    } finally {
      setSavingSecurity(false);
    }
  };

  // Active logo preview — staged file takes priority over live logo
  const activePreview = previewUrl ?? logoUrl;

  return (
    <SidebarProvider>
      <AdminSidebar current="settings" />

      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/users">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 md:p-6 flex-1">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Page header */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage application branding, login permissions, and appearance preferences.
                </p>
              </div>
            </div>

            {/* ── Section 1: Branding ─────────────────────────────── */}
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  App Branding &amp; Logo
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  The logo appears in the sidebar for all users. Accepted: JPG, PNG, WEBP, SVG (max 2 MB).
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Current logo preview */}
                <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-background overflow-hidden">
                    {activePreview ? (
                      <img
                        src={activePreview}
                        alt="App logo preview"
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <ImageOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {selectedFile
                        ? selectedFile.name
                        : logoUrl
                        ? "Current logo"
                        : "No logo set"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {selectedFile
                        ? `${formatBytes(selectedFile.size)} — ready to upload`
                        : logoUrl
                        ? "Used across the sidebar for all users"
                        : "Default icon is currently displayed"}
                    </p>
                    {selectedFile && (
                      <Badge variant="secondary" className="mt-1 text-[10px] bg-primary/10 text-primary">
                        Staged — not yet saved
                      </Badge>
                    )}
                  </div>

                  {/* Remove current logo */}
                  {logoUrl && !selectedFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removing}
                      onClick={() => setRemoveConfirmOpen(true)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      title="Remove logo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Drag-and-drop upload zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 select-none
                    ${isDragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-border bg-muted/10 hover:border-primary/50 hover:bg-muted/20"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isDragging ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isDragging ? "Drop to select" : "Drag & drop or click to browse"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        JPG, PNG, WEBP, SVG — max 2 MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {selectedFile && (
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelSelection}
                      className="text-xs h-8"
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUpload}
                      disabled={uploading}
                      className="text-xs h-8 gap-1.5"
                    >
                      {uploading ? (
                        <>
                          <span className="animate-spin inline-block h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Apply Logo
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Section 2: Security & Login Approvals ───────────── */}
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Security &amp; Device Approvals
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Control first login permissions, device authorization, and role exemption rules.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Master switch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-muted/20">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        Require Admin Approval for First Login &amp; New Devices
                      </span>
                      {requireDeviceApproval ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          Active Policy
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground max-w-xl">
                      When enabled, any user signing in from an unrecognized browser or device must be approved by an administrator before access is granted.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={requireDeviceApproval}
                    onClick={() => setRequireDeviceApproval((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      requireDeviceApproval ? "bg-primary" : "bg-input"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                        requireDeviceApproval ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Role Bypass Selection */}
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-foreground">
                      Roles That Bypass Approval Automatically
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Selected roles will be automatically approved upon first login without triggering a pending request.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {AVAILABLE_ROLES.map((role) => {
                      const isChecked = Boolean(bypassRoles?.includes(role.key) || role.required);
                      const isRequired = Boolean(role.required);

                      return (
                        <div
                          key={role.key}
                          onClick={() => !isRequired && handleToggleRoleBypass(role.key)}
                          className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                            isRequired
                              ? "bg-muted/40 border-border cursor-default opacity-85"
                              : "cursor-pointer hover:border-primary/50 hover:bg-muted/30"
                          } ${isChecked ? "border-primary/40 bg-primary/5" : "bg-card"}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isRequired}
                            onChange={() => !isRequired && handleToggleRoleBypass(role.key)}
                            className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground">
                                {role.label}
                              </span>
                              {isRequired && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 gap-0.5 font-normal">
                                  <Lock className="h-2.5 w-2.5" />
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                              {role.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center justify-end pt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveSecurity}
                    disabled={savingSecurity || !securityLoaded}
                    className="text-xs h-8 gap-1.5"
                  >
                    {savingSecurity ? (
                      <>
                        <span className="animate-spin inline-block h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                        Saving Policy...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save Security Policy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── Section 3: Appearance / Theme ──────────────────── */}
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sun className="h-4 w-4 text-primary" />
                  Appearance &amp; Theme
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred colour scheme. This preference is saved per-browser.
                </p>
              </CardHeader>

              <CardContent>
                {!mounted ? (
                  /* Skeleton while next-themes hydrates to avoid flicker */
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {THEME_OPTIONS.map(({ key, label, Icon, description }) => {
                      const isActive = theme === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTheme(key)}
                          className={`group flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 text-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                            ${isActive
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                            }`}
                        >
                          {/* Theme preview icon */}
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors
                            ${isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div>
                            <p className={`text-xs font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                              {label}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                              {description}
                            </p>
                          </div>

                          {isActive && (
                            <Badge className="text-[9px] py-0 px-1.5 h-4 bg-primary/20 text-primary border-0">
                              Active
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {mounted && theme === "system" && (
                  <p className="mt-3 text-center text-[11px] text-muted-foreground">
                    Currently resolving to{" "}
                    <span className="font-medium text-foreground capitalize">{resolvedTheme}</span> mode based on your OS.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>

      {/* Remove logo confirmation */}
      <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">
              Remove App Logo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              The current logo will be removed for all users and the default icon will be restored. You can upload a new logo at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm" className="text-xs h-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              onClick={handleConfirmRemove}
              className="text-xs h-8"
            >
              Remove Logo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
