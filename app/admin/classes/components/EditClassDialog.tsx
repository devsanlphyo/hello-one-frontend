"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateClass, type ClassItem, type ClassStatus } from "@/lib/api/classes";
import type { School } from "@/lib/api/schools";

interface EditClassDialogProps {
  classItem: ClassItem | null;
  schools: School[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const gradeOptions = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

export function EditClassDialog({
  classItem,
  schools,
  open,
  onOpenChange,
  onSuccess,
}: EditClassDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gradeLevel: "Grade 10",
    academicYear: "2026-2027",
    status: "active" as ClassStatus,
    schoolId: "none",
  });

  useEffect(() => {
    if (classItem) {
      setFormData({
        name: classItem.name || "",
        gradeLevel: classItem.gradeLevel || "Grade 10",
        academicYear: classItem.academicYear || "2026-2027",
        status: classItem.status || "active",
        schoolId: classItem.schoolId || "none",
      });
    }
  }, [classItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classItem?.id) return;
    if (!formData.name.trim() || !formData.gradeLevel.trim()) {
      toast.error("Class Name and Grade Level are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateClass(classItem.id, {
        name: formData.name.trim(),
        gradeLevel: formData.gradeLevel.trim(),
        academicYear: formData.academicYear.trim() || undefined,
        status: formData.status,
        schoolId: formData.schoolId === "none" ? null : formData.schoolId,
      });

      if (res.isSuccess) {
        toast.success(res.message || "Class updated successfully");
        onOpenChange(false);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update class");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Academic Class</DialogTitle>
          <DialogDescription>
            Update class details, academic cohort year, or status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-class-name" className="text-xs">
              Class Section Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-class-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Grade Level <span className="text-destructive">*</span>
              </Label>
              <Select
                items={gradeOptions.map((g) => ({ value: g, label: g }))}
                value={formData.gradeLevel}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    gradeLevel: (val as string) ?? "Grade 10",
                  }))
                }
              >
                <SelectTrigger size="sm" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((grade) => (
                    <SelectItem key={grade} value={grade} className="text-xs">
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-academic-year" className="text-xs">
                Academic Year
              </Label>
              <Input
                id="edit-academic-year"
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    academicYear: e.target.value,
                  }))
                }
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Assigned School</Label>
            <Select
              items={[
                { value: "none", label: "Unassigned" },
                ...schools.map((s) => ({ value: s.id, label: s.name })),
              ]}
              value={formData.schoolId}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  schoolId: (val as string) ?? "none",
                }))
              }
            >
              <SelectTrigger size="sm" className="h-9 text-xs">
                <SelectValue placeholder="Select School" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">
                  Unassigned
                </SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              items={[
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
              ]}
              value={formData.status}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  status: (val as ClassStatus) ?? "active",
                }))
              }
            >
              <SelectTrigger size="sm" className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active" className="text-xs">Active</SelectItem>
                <SelectItem value="archived" className="text-xs">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
