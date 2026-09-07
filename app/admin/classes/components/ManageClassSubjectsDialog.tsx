"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, BookOpen, Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  assignClassSubjectTeacher,
  fetchClassSubjects,
  removeClassSubject,
  type ClassItem,
  type ClassSubjectAssignment,
} from "@/lib/api/classes";
import { fetchSchoolSubjects } from "@/lib/api/schools";
import { fetchUsers } from "@/lib/api/users";
import type { Subject } from "@/lib/api/subjects";
import type { User as UserItem } from "@/app/admin/users/types/user.type";

interface ManageClassSubjectsDialogProps {
  classItem: ClassItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface OptimisticPendingItem {
  subjectName: string;
  subjectCode: string;
  teacherName: string;
}

export function ManageClassSubjectsDialog({
  classItem,
  open,
  onOpenChange,
  onSuccess,
}: ManageClassSubjectsDialogProps) {
  const [assignments, setAssignments] = useState<ClassSubjectAssignment[]>([]);
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<UserItem[]>([]);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingOptimisticItem, setPendingOptimisticItem] =
    useState<OptimisticPendingItem | null>(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(
    null,
  );

  // Delete confirmation state
  const [assignmentToDelete, setAssignmentToDelete] =
    useState<ClassSubjectAssignment | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Form states for adding new subject-teacher assignment
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  const loadData = async (isInitial = false) => {
    if (!classItem?.id) return;

    if (isInitial) {
      setInitialLoading(true);
    }

    try {
      const [assignRes, teachersRes] = await Promise.all([
        fetchClassSubjects(classItem.id),
        fetchUsers({ role: "teacher", status: "active" }),
      ]);

      if (assignRes.isSuccess) {
        setAssignments(assignRes.data);
      }
      if (teachersRes.isSuccess) {
        setTeachers(teachersRes.data);
      }

      if (classItem.schoolId) {
        const schoolSubRes = await fetchSchoolSubjects(classItem.schoolId);
        if (schoolSubRes.isSuccess) {
          setSchoolSubjects(schoolSubRes.data);
          if (isInitial && schoolSubRes.data.length > 0) {
            setSelectedSubjectId(schoolSubRes.data[0].id);
          }
        }
      }
      if (isInitial && teachersRes.isSuccess && teachersRes.data.length > 0) {
        setSelectedTeacherId(teachersRes.data[0].id);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load class curriculum data");
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    if (open && classItem) {
      setAssignments([]);
      setSchoolSubjects([]);
      setTeachers([]);
      setSelectedSubjectId("");
      setSelectedTeacherId("");
      setPendingOptimisticItem(null);
      setDeletingSubjectId(null);
      setAssignmentToDelete(null);
      setDeleteConfirmOpen(false);

      loadData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, classItem?.id]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classItem?.id) return;
    if (!classItem.schoolId) {
      console.warn("⚠️ [Assign Teacher] Aborted: class is not assigned to a school.", classItem);
      toast.error("Please assign this class to a school first.");
      return;
    }
    if (!selectedSubjectId || !selectedTeacherId) {
      console.warn("⚠️ [Assign Teacher] Aborted: missing subject or teacher selection.", {
        selectedSubjectId,
        selectedTeacherId,
      });
      toast.error("Please select both a subject and a teacher.");
      return;
    }

    const targetSub = schoolSubjects.find((s) => s.id === selectedSubjectId);
    const targetTeacher = teachers.find((t) => t.id === selectedTeacherId);

    console.group("🚀 [Assign Teacher to Class]");
    console.log("Class:", {
      id: classItem.id,
      name: classItem.name,
      school: classItem.school?.name,
      schoolId: classItem.schoolId,
    });
    console.log("Selected Subject:", targetSub ? { id: targetSub.id, name: targetSub.name, code: targetSub.code } : selectedSubjectId);
    console.log("Selected Teacher:", targetTeacher ? { id: targetTeacher.id, name: targetTeacher.fullName, email: targetTeacher.email } : selectedTeacherId);
    console.log("Payload sent to API:", {
      classId: classItem.id,
      subjectId: selectedSubjectId,
      teacherId: selectedTeacherId,
    });

    // Set optimistic placeholder immediately
    setPendingOptimisticItem({
      subjectName: targetSub?.name || "Subject",
      subjectCode: targetSub?.code || "",
      teacherName: targetTeacher?.fullName || "Teacher",
    });

    setSubmitting(true);
    try {
      const res = await assignClassSubjectTeacher(classItem.id, {
        subjectId: selectedSubjectId,
        teacherId: selectedTeacherId,
      });

      console.log("✅ API Response [assignClassSubjectTeacher]:", res);

      if (res.isSuccess) {
        toast.success(res.message || "Subject and teacher allocated to class");

        // Ensure subject and teacher relations are present even if backend didn't populate them
        const populatedItem: ClassSubjectAssignment = {
          ...res.data,
          subject: res.data.subject || targetSub!,
          teacher: res.data.teacher || (targetTeacher ? {
            id: targetTeacher.id,
            fullName: targetTeacher.fullName,
            email: targetTeacher.email,
          } : null),
        };

        // Swap optimistic item with actual assigned item
        setAssignments((prev) => {
          const filtered = prev.filter(
            (a) => a.subjectId !== populatedItem.subjectId,
          );
          const nextAssignments = [populatedItem, ...filtered];
          console.log("📋 Updated Assignments State:", nextAssignments);
          return nextAssignments;
        });

        // Trigger background sync to guarantee full consistency
        loadData();
        onSuccess();
      }
    } catch (error: any) {
      console.error("❌ API Error [assignClassSubjectTeacher]:", error);
      toast.error(error.message || "Failed to assign subject teacher");
    } finally {
      console.groupEnd();
      setPendingOptimisticItem(null);
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!classItem?.id || !assignmentToDelete) return;

    const subjectId = assignmentToDelete.subjectId;
    setDeletingSubjectId(subjectId);
    setDeleteConfirmOpen(false);

    try {
      const res = await removeClassSubject(classItem.id, subjectId);
      if (res.isSuccess) {
        toast.success(res.message || "Subject removed from class");
        setAssignments((prev) => prev.filter((a) => a.subjectId !== subjectId));
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove subject");
    } finally {
      setDeletingSubjectId(null);
      setAssignmentToDelete(null);
    }
  };

  const openDeleteDialog = (item: ClassSubjectAssignment) => {
    setAssignmentToDelete(item);
    setDeleteConfirmOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Class Subjects &amp; Teachers
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Configure subject allocations for &ldquo;{classItem?.name}&rdquo; ({classItem?.school?.name || "Unassigned School"})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {!classItem?.schoolId && !initialLoading ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
              ⚠️ This class is not yet assigned to a school. Please assign it to a school first so curriculum subjects can be selected.
            </div>
          ) : (
            <div className="space-y-4 py-1 text-xs">
              {/* Allocation Form or Skeleton */}
              {initialLoading ? (
                <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-8 sm:h-7 w-full sm:w-20 rounded-md" />
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAssign} className="p-3 rounded-lg border bg-muted/30 space-y-3">
                  <span className="font-semibold text-foreground block">
                    Allocate Subject to Teacher
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">
                        Subject (Offered by School)
                      </label>
                      <Select
                        items={schoolSubjects.map((s) => ({
                          value: s.id,
                          label: `${s.name} (${s.code})`,
                        }))}
                        value={selectedSubjectId}
                        onValueChange={(val) => setSelectedSubjectId((val as string) ?? "")}
                      >
                        <SelectTrigger size="sm" className="h-8 text-xs w-full">
                          <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {schoolSubjects.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id} className="text-xs">
                              {sub.name} ({sub.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">
                        Assigned Teacher
                      </label>
                      <Select
                        items={teachers.map((t) => ({
                          value: t.id,
                          label: `${t.fullName}`,
                        }))}
                        value={selectedTeacherId}
                        onValueChange={(val) => setSelectedTeacherId((val as string) ?? "")}
                      >
                        <SelectTrigger size="sm" className="h-8 text-xs w-full">
                          <SelectValue placeholder="Select Teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id} className="text-xs">
                              {teacher.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      Teacher will automatically link to {classItem?.school?.name}
                    </span>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submitting || schoolSubjects.length === 0}
                      className="h-8 sm:h-7 text-xs gap-1 w-full sm:w-auto"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{submitting ? "Allocating..." : "Assign"}</span>
                    </Button>
                  </div>
                </form>
              )}

              {/* Current Class Subject Assignments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground block">
                    Current Class Subjects ({assignments.length + (pendingOptimisticItem ? 1 : 0)})
                  </span>
                </div>

                {initialLoading ? (
                  // Initial Loading Skeletons matching exact subject card shape
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg border bg-card/60"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-3.5 w-12 rounded-sm" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="h-3 w-36" />
                          </div>
                        </div>
                        <Skeleton className="h-7 w-7 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : assignments.length > 0 || pendingOptimisticItem ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {/* Optimistic Pending Card when assigning */}
                    {pendingOptimisticItem && (
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 text-xs animate-pulse">
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <span>{pendingOptimisticItem.subjectName}</span>
                            {pendingOptimisticItem.subjectCode && (
                              <Badge variant="outline" className="text-[10px] font-mono opacity-80">
                                {pendingOptimisticItem.subjectCode}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary py-0">
                              Saving...
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mt-0.5">
                            <User className="h-3 w-3 text-primary" />
                            <span>Teacher: {pendingOptimisticItem.teacherName}</span>
                          </div>
                        </div>
                        <Skeleton className="h-6 w-6 rounded-md" />
                      </div>
                    )}

                    {/* Active Assignments */}
                    {assignments.map((item) => {
                      const isDeleting = deletingSubjectId === item.subjectId;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs shadow-2xs transition-all duration-200 ${
                            isDeleting
                              ? "opacity-40 pointer-events-none scale-[0.99] bg-muted/40"
                              : "opacity-100"
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="font-medium text-foreground flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{item.subject?.name}</span>
                              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                {item.subject?.code}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mt-0.5">
                              <User className="h-3 w-3 text-primary shrink-0" />
                              <span className="truncate">Teacher: {item.teacher?.fullName || "Unassigned"}</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(item)}
                            disabled={isDeleting || submitting}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove Subject"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Remove Subject</span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-[11px]">
                    No subjects currently allocated to this class. Use the form above to add subjects.
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert Dialog for Deleting / Removing */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <AlertDialogTitle className="text-sm font-semibold">
                Remove Subject Allocation?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground text-left">
              Are you sure you want to remove{" "}
              <strong className="text-foreground">
                {assignmentToDelete?.subject?.name} ({assignmentToDelete?.subject?.code})
              </strong>{" "}
              from <strong className="text-foreground">{classItem?.name}</strong>?
              {assignmentToDelete?.teacher && (
                <span className="block mt-1">
                  Teacher <em>{assignmentToDelete.teacher.fullName}</em> will no longer be assigned to this class section.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel size="sm" className="text-xs h-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              onClick={handleConfirmDelete}
              className="text-xs h-8"
            >
              Confirm Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
