"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Power,
} from "lucide-react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { fetchSubjects, updateSubject, type Subject } from "@/lib/api/subjects";
import { CreateSubjectDialog } from "./components/CreateSubjectDialog";
import { EditSubjectDialog } from "./components/EditSubjectDialog";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Dialog states
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const loadSubjects = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchSubjects();
      if (res.isSuccess) {
        setSubjects(res.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load subjects catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const handleToggleStatus = async (subject: Subject) => {
    const newStatus = subject.status === "active" ? "archived" : "active";
    setTogglingId(subject.id);
    try {
      const res = await updateSubject(subject.id, { status: newStatus });
      toast.success(res.message || `Subject status updated to ${newStatus}`);
      setSubjects((prev) =>
        prev.map((s) => (s.id === subject.id ? { ...s, status: newStatus } : s)),
      );
      loadSubjects(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to update subject status");
    } finally {
      setTogglingId(null);
    }
  };

  const activeSubjectsCount = subjects.filter(
    (s) => s.status === "active",
  ).length;

  return (
    <SidebarProvider>
      <AdminSidebar current="subjects" />

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
                <BreadcrumbPage>Subjects Catalog</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 md:p-6 flex-1">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Header section */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Academic Subjects
                </h1>
                <p className="text-sm text-muted-foreground">
                  Master catalog of educational courses, codes, and curriculum
                  offerings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <CreateSubjectDialog onSuccess={loadSubjects} />
              </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Total Master Subjects
                  </CardTitle>
                  <BookMarked className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-8 w-14 animate-pulse rounded bg-muted/50 my-0.5" />
                  ) : (
                    <div className="text-2xl font-bold">{subjects.length}</div>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Disciplines defined in system
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Active Subjects
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-8 w-14 animate-pulse rounded bg-muted/50 my-0.5" />
                  ) : (
                    <div className="text-2xl font-bold text-emerald-600">
                      {activeSubjectsCount}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Available for school curricula
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subjects Table */}
            <div className="rounded-md border bg-card shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-80 text-xs font-semibold">
                      Subject Title
                    </TableHead>
                    <TableHead className="text-xs font-semibold w-36">
                      Subject Code
                    </TableHead>
                    <TableHead className="text-xs font-semibold w-28">
                      Status
                    </TableHead>
                    <TableHead className="w-24 text-right text-xs font-semibold pr-4">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 animate-pulse rounded bg-muted/50 shrink-0" />
                            <div className="h-4 w-36 animate-pulse rounded bg-muted/50" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-16 animate-pulse rounded bg-muted/50" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-14 animate-pulse rounded bg-muted/50" />
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <div className="h-8 w-8 animate-pulse rounded bg-muted/50" />
                            <div className="h-8 w-8 animate-pulse rounded bg-muted/50" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : subjects.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-32 text-center text-xs text-muted-foreground"
                      >
                        No subjects found. Click &quot;Create Subject&quot; to
                        define your first academic subject.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subjects.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
                              <BookOpen className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-semibold text-foreground text-sm">
                              {sub.name}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono tracking-tight uppercase"
                          >
                            {sub.code}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs">
                          <Badge
                            variant={
                              sub.status === "active"
                                ? "default"
                                : "destructive"
                            }
                            className="text-[10px] capitalize"
                          >
                            {sub.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={togglingId === sub.id}
                              onClick={() => {
                                setSelectedSubject(sub);
                                setEditDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              title="Edit Subject"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit Subject</span>
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={togglingId === sub.id}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                    title="More Options"
                                  >
                                    {togglingId === sub.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">
                                      More options
                                    </span>
                                  </Button>
                                }
                              />
                              <DropdownMenuContent
                                align="end"
                                className="text-xs w-min text-nowrap"
                              >
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSubject(sub);
                                    setEditDialogOpen(true);
                                  }}
                                  className="cursor-pointer gap-2"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Edit Subject</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  disabled={togglingId === sub.id}
                                  onClick={() => handleToggleStatus(sub)}
                                  className={`cursor-pointer gap-2 ${
                                    sub.status === "active"
                                      ? "text-destructive focus:text-destructive"
                                      : "text-emerald-600 focus:text-emerald-600"
                                  }`}
                                >
                                  {togglingId === sub.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Power className="h-3.5 w-3.5" />
                                  )}
                                  <span>
                                    {sub.status === "active"
                                      ? "Archive Subject"
                                      : "Re-activate Subject"}
                                  </span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </SidebarInset>

      {/* Edit Subject Dialog */}
      <EditSubjectDialog
        subject={selectedSubject}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={loadSubjects}
      />
    </SidebarProvider>
  );
}
