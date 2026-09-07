"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  Power,
  User,
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
import { fetchSchools, updateSchool, type School } from "@/lib/api/schools";
import { CreateSchoolDialog } from "./components/CreateSchoolDialog";
import { EditSchoolDialog } from "./components/EditSchoolDialog";
import { ManageSchoolSubjectsDialog } from "./components/ManageSchoolSubjectsDialog";
import { SchoolDetailDialog } from "./components/SchoolDetailDialog";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal dialog states
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subjectsDialogOpen, setSubjectsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailSchoolId, setDetailSchoolId] = useState<string | null>(null);

  const loadSchools = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSchools();
      if (res.isSuccess) {
        setSchools(res.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load schools from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  const handleToggleStatus = async (school: School) => {
    const newStatus = school.status === "active" ? "suspend" : "active";
    try {
      const res = await updateSchool(school.id, { status: newStatus });
      toast.success(res.message || `School status updated to ${newStatus}`);
      loadSchools();
    } catch (error: any) {
      toast.error(error.message || "Failed to update school status");
    }
  };

  const activeCount = schools.filter((s) => s.status === "active").length;
  const totalClassesCount = schools.reduce(
    (acc, s) => acc + (s.classesCount || 0),
    0,
  );

  return (
    <SidebarProvider>
      <AdminSidebar current="schools" />

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
                <BreadcrumbPage>Schools Management</BreadcrumbPage>
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
                  Schools Directory
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage institutional schools, leadership, curriculum subjects,
                  and affiliated classes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <CreateSchoolDialog onSuccess={loadSchools} />
              </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Total Schools
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{schools.length}</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Registered institution records
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Active Schools
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {activeCount}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Operational school institutions
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Enrolled Classes
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalClassesCount}</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Assigned academic class sections
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Schools Table */}
            <div className="rounded-md border bg-card shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-72 text-xs font-semibold">
                      School Information
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Headmaster Leadership
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center w-28">
                      Curriculum
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center w-24">
                      Classes
                    </TableHead>
                    <TableHead className="text-xs font-semibold w-24">
                      Status
                    </TableHead>
                    <TableHead className="w-24 text-right text-xs font-semibold pr-4">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={6}>
                          <div className="h-8 w-full animate-pulse rounded bg-muted/50" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : schools.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-xs text-muted-foreground"
                      >
                        No schools found. Click &quot;Add School&quot; to
                        register your first school.
                      </TableCell>
                    </TableRow>
                  ) : (
                    schools.map((school) => (
                      <TableRow key={school.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium text-xs">
                          <div>
                            <span className="font-semibold text-foreground text-sm">
                              {school.name}
                            </span>
                            <div className="mt-0.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono tracking-tight uppercase px-1.5 py-0"
                              >
                                {school.code}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <span className="font-medium text-foreground">
                              {school.headmaster?.fullName ||
                                school.principalName ||
                                "Not Assigned"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSchool(school);
                              setSubjectsDialogOpen(true);
                            }}
                            className="h-7 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <BookOpen className="h-3 w-3" />
                            <span>{school.subjectsCount || 0} subjects</span>
                          </Button>
                        </TableCell>

                        <TableCell className="text-xs text-center">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-medium"
                          >
                            {school.classesCount || 0} classes
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs">
                          <Badge
                            variant={
                              school.status === "active"
                                ? "default"
                                : "destructive"
                            }
                            className="text-[10px] capitalize"
                          >
                            {school.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDetailSchoolId(school.id);
                                setDetailDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Details</span>
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                    title="More Options"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">
                                      More options
                                    </span>
                                  </Button>
                                }
                              />
                              <DropdownMenuContent
                                align="end"
                                className="text-xs text-nowrap w-min"
                              >
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSchool(school);
                                    setSubjectsDialogOpen(true);
                                  }}
                                  className="cursor-pointer gap-2"
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                  <span>Curriculum Subjects</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSchool(school);
                                    setEditDialogOpen(true);
                                  }}
                                  className="cursor-pointer gap-2"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Edit School</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(school)}
                                  className={`cursor-pointer gap-2 ${
                                    school.status === "active"
                                      ? "text-destructive focus:text-destructive"
                                      : "text-emerald-600 focus:text-emerald-600"
                                  }`}
                                >
                                  <Power className="h-3.5 w-3.5" />
                                  <span>
                                    {school.status === "active"
                                      ? "Suspend School"
                                      : "Re-activate School"}
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

      {/* Edit School Dialog */}
      <EditSchoolDialog
        school={selectedSchool}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={loadSchools}
      />

      {/* School Curriculum Subjects Dialog */}
      <ManageSchoolSubjectsDialog
        school={selectedSchool}
        open={subjectsDialogOpen}
        onOpenChange={setSubjectsDialogOpen}
        onSuccess={loadSchools}
      />

      {/* School Detail Dialog */}
      <SchoolDetailDialog
        schoolId={detailSchoolId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </SidebarProvider>
  );
}
