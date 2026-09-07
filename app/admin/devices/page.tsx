"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Clock,
  Globe,
  Laptop,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  approveDevice,
  deleteDevice,
  fetchDevices,
  rejectDevice,
  revokeDevice,
  UserDeviceItem,
} from "@/lib/api/devices";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/10 text-red-600 border-red-500/20",
  director: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  headmaster: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  teacher: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  officer: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  assistant: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<UserDeviceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [search, setSearch] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Delete dialog state
  const [deviceToDelete, setDeviceToDelete] = useState<UserDeviceItem | null>(null);

  // Summary counts
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [revokedCount, setRevokedCount] = useState(0);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch devices for current view
      const res = await fetchDevices({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
        limit: 50,
      });

      if (res.isSuccess) {
        setDevices(res.items);
        setTotal(res.total);
      }

      // Also refresh summary counts
      const [allRes, pRes, aRes, rRes] = await Promise.all([
        fetchDevices({ status: "all", limit: 1 }),
        fetchDevices({ status: "pending", limit: 1 }),
        fetchDevices({ status: "approved", limit: 1 }),
        fetchDevices({ status: "revoked", limit: 1 }),
      ]);
      if (pRes.isSuccess) setPendingCount(pRes.total);
      if (aRes.isSuccess) setApprovedCount(aRes.total);
      if (rRes.isSuccess) setRevokedCount(rRes.total);
    } catch (err: any) {
      toast.error(err.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleApprove = async (device: UserDeviceItem) => {
    setActionInProgress(device.id);
    try {
      const res = await approveDevice(device.id);
      if (res.isSuccess) {
        toast.success(`Approved login access for ${device.user?.fullName || "user"}`);
        await loadDevices();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve device");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (device: UserDeviceItem) => {
    setActionInProgress(device.id);
    try {
      const res = await rejectDevice(device.id);
      if (res.isSuccess) {
        toast.warning(`Denied login request for ${device.user?.fullName || "user"}`);
        await loadDevices();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reject device");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRevoke = async (device: UserDeviceItem) => {
    setActionInProgress(device.id);
    try {
      const res = await revokeDevice(device.id);
      if (res.isSuccess) {
        toast.info(`Revoked device access for ${device.user?.fullName || "user"}`);
        await loadDevices();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke device");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!deviceToDelete) return;
    try {
      const res = await deleteDevice(deviceToDelete.id);
      if (res.isSuccess) {
        toast.success("Device record removed");
        setDeviceToDelete(null);
        await loadDevices();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete device");
    }
  };

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

  return (
    <SidebarProvider>
      <AdminSidebar current="devices" />

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
                <BreadcrumbPage>Device Approvals</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 md:p-6 flex-1 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Device Approvals</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage user login devices, approve first logins, and revoke untrusted devices.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadDevices}
              disabled={loading}
              className="gap-2 text-xs h-9 self-start sm:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card
              onClick={() => setStatusFilter("pending")}
              className={`cursor-pointer transition-all hover:border-amber-500/50 ${
                statusFilter === "pending" ? "border-amber-500 ring-1 ring-amber-500 bg-amber-500/5" : ""
              }`}
            >
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                  <span>Pending Approvals</span>
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-amber-500">
                  {pendingCount}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Requires admin action</p>
              </CardContent>
            </Card>

            <Card
              onClick={() => setStatusFilter("approved")}
              className={`cursor-pointer transition-all hover:border-emerald-500/50 ${
                statusFilter === "approved" ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-500/5" : ""
              }`}
            >
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                  <span>Approved Devices</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-emerald-500">
                  {approvedCount}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Active trusted devices</p>
              </CardContent>
            </Card>

            <Card
              onClick={() => setStatusFilter("revoked")}
              className={`cursor-pointer transition-all hover:border-destructive/50 ${
                statusFilter === "revoked" ? "border-destructive ring-1 ring-destructive bg-destructive/5" : ""
              }`}
            >
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                  <span>Revoked / Denied</span>
                  <ShieldX className="h-4 w-4 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-destructive">
                  {revokedCount}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Access blocked</p>
              </CardContent>
            </Card>

            <Card
              onClick={() => setStatusFilter("all")}
              className={`cursor-pointer transition-all hover:border-primary/50 ${
                statusFilter === "all" ? "border-primary ring-1 ring-primary bg-primary/5" : ""
              }`}
            >
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                  <span>All Records</span>
                  <Laptop className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-foreground">
                  {pendingCount + approvedCount + revokedCount}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Total device sessions</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Bar & Search */}
          <Card className="shadow-xs">
            <CardHeader className="p-4 pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg w-fit text-xs">
                  {[
                    { key: "pending", label: "Pending", count: pendingCount },
                    { key: "approved", label: "Approved", count: approvedCount },
                    { key: "revoked", label: "Revoked", count: revokedCount },
                    { key: "all", label: "All Devices" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                        statusFilter === tab.key
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {typeof tab.count === "number" && tab.count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0 rounded-full font-bold ${
                            tab.key === "pending"
                              ? "bg-amber-500 text-white"
                              : "bg-muted-foreground/20 text-muted-foreground"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search user, email, device, IP..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Devices Table */}
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-64">User / Account</TableHead>
                    <TableHead>Device &amp; Browser</TableHead>
                    <TableHead>Network / IP</TableHead>
                    <TableHead>Requested / Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-9 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : devices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-44 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Laptop className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-sm font-medium">No device records found</p>
                          <p className="text-xs">
                            {statusFilter === "pending"
                              ? "There are currently no pending device approval requests."
                              : "No devices match your search or filter criteria."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    devices.map((device) => {
                      const roleColor =
                        ROLE_COLORS[device.user?.role?.toLowerCase() || ""] ||
                        "bg-muted text-muted-foreground";

                      return (
                        <TableRow key={device.id} className="text-xs">
                          {/* User Column */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="size-8 shrink-0 border">
                                <AvatarImage src={device.user?.avatarUrl || undefined} />
                                <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                                  {device.user?.fullName
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-foreground truncate max-w-36">
                                    {device.user?.fullName || "Unknown User"}
                                  </span>
                                  {device.user?.role && (
                                    <Badge
                                      variant="outline"
                                      className={`text-[9px] px-1 py-0 uppercase font-semibold shrink-0 ${roleColor}`}
                                    >
                                      {device.user.role}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {device.user?.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Device Column */}
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="font-medium text-foreground flex items-center gap-1.5">
                                <Laptop className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>{device.deviceName || "Web Client"}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-xs" title={device.deviceId}>
                                ID: {device.deviceId.slice(0, 16)}...
                              </p>
                            </div>
                          </TableCell>

                          {/* IP Column */}
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                              <Globe className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                              <span>{device.ipAddress || "Unknown"}</span>
                            </div>
                          </TableCell>

                          {/* Requested / Last Login */}
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-foreground">
                                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span>First: {formatDate(device.createdAt)}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                Last: {formatDate(device.lastLoginAt)}
                              </p>
                            </div>
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell>
                            {device.status === "pending" && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30 gap-1 font-semibold"
                              >
                                <ShieldAlert className="h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                            {device.status === "approved" && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1 font-semibold"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Approved
                              </Badge>
                            )}
                            {(device.status === "rejected" || device.status === "revoked") && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-destructive/10 text-destructive border-destructive/30 gap-1 font-semibold capitalize"
                              >
                                <ShieldX className="h-3 w-3" />
                                {device.status}
                              </Badge>
                            )}
                          </TableCell>

                          {/* Action Buttons */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {device.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(device)}
                                    disabled={actionInProgress === device.id}
                                    className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                  >
                                    <Check className="h-3 w-3" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReject(device)}
                                    disabled={actionInProgress === device.id}
                                    className="h-7 text-xs px-2.5 text-destructive hover:bg-destructive/10 border-destructive/30 gap-1"
                                  >
                                    <X className="h-3 w-3" />
                                    Reject
                                  </Button>
                                </>
                              )}

                              {device.status === "approved" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevoke(device)}
                                  disabled={actionInProgress === device.id}
                                  className="h-7 text-xs px-2.5 text-destructive hover:bg-destructive/10 border-destructive/30 gap-1"
                                >
                                  <ShieldX className="h-3 w-3" />
                                  Revoke
                                </Button>
                              )}

                              {(device.status === "rejected" || device.status === "revoked") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(device)}
                                  disabled={actionInProgress === device.id}
                                  className="h-7 text-xs px-2.5 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/30 gap-1"
                                >
                                  <Check className="h-3 w-3" />
                                  Re-approve
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeviceToDelete(device)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Delete record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>

      {/* Delete Device Confirmation Dialog */}
      <AlertDialog open={!!deviceToDelete} onOpenChange={(open) => !open && setDeviceToDelete(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">
              Delete Device Record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will remove the device record for{" "}
              <strong className="text-foreground">{deviceToDelete?.user?.fullName}</strong> ({deviceToDelete?.deviceName}).
              If the user logs in again from this device, a new approval request will be generated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm" className="text-xs h-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              className="text-xs h-8"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
