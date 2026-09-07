"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Building2,
  GraduationCap,
  Layers,
  MoreHorizontal,
  Pencil,
  Power,
  School as SchoolIcon,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  fetchClasses,
  updateClass,
  type ClassItem,
} from "@/lib/api/classes";
import { fetchSchools, type School } from "@/lib/api/schools";
import { AssignSchoolDialog } from "./components/AssignSchoolDialog";
import { CreateClassDialog } from "./components/CreateClassDialog";
import { EditClassDialog } from "./components/EditClassDialog";
import { ManageClassSubjectsDialog } from "./components/ManageClassSubjectsDialog";

const gradeFilterOptions = [
  { value: "default", label: "All Grades" },
  { value: "Grade 1", label: "Grade 1" },
  { value: "Grade 2", label: "Grade 2" },
  { value: "Grade 3", label: "Grade 3" },
  { value: "Grade 4", label: "Grade 4" },
  { value: "Grade 5", label: "Grade 5" },
  { value: "Grade 6", label: "Grade 6" },
  { value: "Grade 7", label: "Grade 7" },
  { value: "Grade 8", label: "Grade 8" },
  { value: "Grade 9", label: "Grade 9" },
  { value: "Grade 10", label: "Grade 10" },
  { value: "Grade 11", label: "Grade 11" },
  { value: "Grade 12", label: "Grade 12" },
];

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState("default");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("default");

  // Dialog states
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [subjectsDialogOpen, setSubjectsDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, schoolsRes] = await Promise.all([
        fetchClasses({
          schoolId:
            selectedSchoolFilter !== "default"
              ? selectedSchoolFilter
              : undefined,
          gradeLevel:
            selectedGradeFilter !== "default"
              ? selectedGradeFilter
              : undefined,
        }),
        fetchSchools(),
      ]);

      if (classesRes.isSuccess) {
        setClasses(classesRes.data);
      }
      if (schoolsRes.isSuccess) {
        setSchools(schoolsRes.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load classes data");
    } finally {
      setLoading(false);
    }
  }, [selectedSchoolFilter, selectedGradeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async (classItem: ClassItem) => {
    const newStatus = classItem.status === "active" ? "archived" : "active";
    try {
      const res = await updateClass(classItem.id, { status: newStatus });
      toast.success(
        res.message || `Class status updated to ${newStatus}`,
      );
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update class status");
    }
  };

  const activeClassesCount = classes.filter((c) => c.status === "active").length;
  const assignedClassesCount = classes.filter((c) => !!c.schoolId).length;

  return (
    <SidebarProvider>
      <AdminSidebar current="classes" />

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
                <BreadcrumbPage>Classes Management</BreadcrumbPage>
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
                  Academic Classes
                </h1>
                <p className="text-sm text-muted-foreground">
                  Organize grade cohorts, classroom sections, curriculum subjects, and teacher allocations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <CreateClassDialog schools={schools} onSuccess={loadData} />
              </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Total Classes
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classes.length}</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Classroom sections configured
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Active Cohorts
                  </CardTitle>
                  <GraduationCap className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {activeClassesCount}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Currently active academic classes
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Assigned to School
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignedClassesCount}</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Linked to school institutions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* School Filter */}
                <Select
                  items={[
                    { value: "default", label: "All Schools" },
                    ...schools.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                  value={selectedSchoolFilter}
                  onValueChange={(val) =>
                    setSelectedSchoolFilter((val as string) ?? "default")
                  }
                >
                  <SelectTrigger size="sm" className="h-9 text-xs w-44">
                    <SelectValue placeholder="All Schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default" className="text-xs">
                      All Schools
                    </SelectItem>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id} className="text-xs">
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Grade Level Filter */}
                <Select
                  items={gradeFilterOptions}
                  value={selectedGradeFilter}
                  onValueChange={(val) =>
                    setSelectedGradeFilter((val as string) ?? "default")
                  }
                >
                  <SelectTrigger size="sm" className="h-9 text-xs w-36">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeFilterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{classes.length}</span> classes
              </div>
            </div>

            {/* Classes Table */}
            <div className="rounded-md border bg-card shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-60 text-xs font-semibold">Class Section</TableHead>
                    <TableHead className="text-xs font-semibold w-24">Grade</TableHead>
                    <TableHead className="text-xs font-semibold w-28">Year</TableHead>
                    <TableHead className="text-xs font-semibold">Assigned School</TableHead>
                    <TableHead className="text-xs font-semibold text-center w-28">Subjects</TableHead>
                    <TableHead className="text-xs font-semibold w-24">Status</TableHead>
                    <TableHead className="w-24 text-right text-xs font-semibold pr-4">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={7}>
                          <div className="h-8 w-full animate-pulse rounded bg-muted/50" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : classes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-xs text-muted-foreground"
                      >
                        No classes found for the selected criteria. Click &quot;Create Class&quot; to add a new section.
                      </TableCell>
                    </TableRow>
                  ) : (
                    classes.map((cls) => (
                      <TableRow key={cls.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
                              <Layers className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-semibold text-foreground">
                              {cls.name}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px]">
                            {cls.gradeLevel}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {cls.academicYear}
                        </TableCell>

                        <TableCell className="text-xs">
                          {cls.school ? (
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{cls.school.name}</span>
                            </div>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] text-muted-foreground bg-muted"
                            >
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedClass(cls);
                              setSubjectsDialogOpen(true);
                            }}
                            className="h-7 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                            title="Configure Class Subjects & Teachers"
                          >
                            <BookOpen className="h-3 w-3" />
                            <span>{cls.classSubjects?.length || 0} subjects</span>
                          </Button>
                        </TableCell>

                        <TableCell className="text-xs">
                          <Badge
                            variant={
                              cls.status === "active" ? "default" : "destructive"
                            }
                            className="text-[10px] capitalize"
                          >
                            {cls.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedClass(cls);
                                setSubjectsDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              title="Subjects & Teachers"
                            >
                              <BookOpen className="h-4 w-4" />
                              <span className="sr-only">Subjects &amp; Teachers</span>
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
                                    <span className="sr-only">More options</span>
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="text-xs min-w-40">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClass(cls);
                                    setSubjectsDialogOpen(true);
                                  }}
                                  className="cursor-pointer gap-2"
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                  <span>Subjects &amp; Teachers</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClass(cls);
                                    setAssignDialogOpen(true);
                                  }}
                                  className="cursor-pointer gap-2"
                                >
                                  <SchoolIcon className="h-3.5 w-3.5" />
                                  <span>Assign School</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClass(cls);
                                    setEditDialogOpen(true);
                                  }}
                                  className="cursor-pointer gap-2"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Edit Class</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(cls)}
                                  className={`cursor-pointer gap-2 ${
                                    cls.status === "active"
                                      ? "text-destructive focus:text-destructive"
                                      : "text-emerald-600 focus:text-emerald-600"
                                  }`}
                                >
                                  <Power className="h-3.5 w-3.5" />
                                  <span>
                                    {cls.status === "active"
                                      ? "Archive Class"
                                      : "Re-activate Class"}
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

      {/* Assign School Dialog */}
      <AssignSchoolDialog
        classItem={selectedClass}
        schools={schools}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onSuccess={loadData}
      />

      {/* Edit Class Dialog */}
      <EditClassDialog
        classItem={selectedClass}
        schools={schools}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={loadData}
      />

      {/* Manage Class Subjects & Teachers Dialog */}
      <ManageClassSubjectsDialog
        classItem={selectedClass}
        open={subjectsDialogOpen}
        onOpenChange={setSubjectsDialogOpen}
        onSuccess={loadData}
      />
    </SidebarProvider>
  );
}
