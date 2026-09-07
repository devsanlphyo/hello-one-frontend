"use client";

import {
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

import { RegisterUserDialog } from "./components/RegisterUserDialog";
import UsersTable from "./components/UsersTable";
import { fetchUsers, suspendUser, updateUser } from "@/lib/api/users";
import type { User } from "./types/user.type";

const roleOptions = [
  { value: "default", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "director", label: "Director" },
  { value: "headmaster", label: "Headmaster" },
  { value: "teacher", label: "Teacher" },
  { value: "assistant", label: "Assistant" },
  { value: "officer", label: "Officer" },
];

const statusOptions = [
  { value: "default", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "suspend", label: "Suspended" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("default");
  const [status, setStatus] = useState("default");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search effect (350ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  // Reset to page 1 whenever debounced search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchUsers({
        page,
        limit,
        search: debouncedSearch,
        role: role !== "default" ? role : undefined,
        status: status !== "default" ? status : undefined,
      });

      if (res.isSuccess) {
        setUsers(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages || 1);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load users from server");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, role, status]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSuspend = async (userToSuspend: User) => {
    if (!userToSuspend.id) return;
    try {
      const res = await suspendUser(userToSuspend.id);
      toast.success(res.message || "User suspended successfully");
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to suspend user");
    }
  };

  const handleReactivate = async (userToReactivate: User) => {
    if (!userToReactivate.id) return;
    try {
      const res = await updateUser(userToReactivate.id, { status: "active" });
      toast.success(res.message || "User account re-activated successfully");
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to re-activate user");
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar current="users" />

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
                <BreadcrumbPage>Users Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 md:p-6 flex-1">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Header section */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">System Users</h1>
                <p className="text-sm text-muted-foreground">
                  Create, configure, and manage staff accounts and role permissions.
                </p>
              </div>

              <div className="flex items-center">
                <RegisterUserDialog
                  onSuccess={() => {
                    loadUsers();
                  }}
                />
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by full name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select
                  items={roleOptions}
                  value={role}
                  onValueChange={(val) => {
                    setRole((val as string) ?? "default");
                    setPage(1);
                  }}
                >
                  <SelectTrigger size="sm" className="h-9 text-xs w-32">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="text-xs">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  items={statusOptions}
                  value={status}
                  onValueChange={(val) => {
                    setStatus((val as string) ?? "default");
                    setPage(1);
                  }}
                >
                  <SelectTrigger size="sm" className="h-9 text-xs w-28">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="text-xs">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Users Data Table */}
            <UsersTable
              users={users}
              loading={loading}
              onEditSuccess={() => {
                loadUsers();
              }}
              onSuspend={handleSuspend}
              onReactivate={handleReactivate}
            />

            {/* Mobile-Friendly Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-6 px-1 border-t sm:border-t-0 text-xs text-muted-foreground">
              <div className="w-full sm:w-auto text-center sm:text-left">
                <p>
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {total === 0 ? 0 : (page - 1) * limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-foreground">
                    {Math.min(page * limit, total)}
                  </span>{" "}
                  of <span className="font-semibold text-foreground">{total}</span>{" "}
                  Users
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1 || loading}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 px-3 text-xs shadow-xs"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="px-3 py-1.5 rounded-md bg-muted/60 sm:bg-transparent font-medium text-foreground text-center min-w-24">
                  Page {page} / {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={page >= totalPages || loading}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 px-3 text-xs shadow-xs"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

