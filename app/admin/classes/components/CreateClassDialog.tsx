"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createClass } from "@/lib/api/classes";
import type { School } from "@/lib/api/schools";

interface CreateClassDialogProps {
  schools: School[];
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

export function CreateClassDialog({
  schools,
  onSuccess,
}: CreateClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gradeLevel: "Grade 10",
    academicYear: "2026-2027",
    schoolId: "none",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.gradeLevel.trim()) {
      toast.error("Class Name and Grade Level are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await createClass({
        name: formData.name.trim(),
        gradeLevel: formData.gradeLevel.trim(),
        academicYear: formData.academicYear.trim() || undefined,
        schoolId:
          formData.schoolId && formData.schoolId !== "none"
            ? formData.schoolId
            : undefined,
      });

      if (res.isSuccess) {
        toast.success(res.message || "Class section created successfully");
        setFormData({
          name: "",
          gradeLevel: "Grade 10",
          academicYear: "2026-2027",
          schoolId: "none",
        });
        setOpen(false);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create class section");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Create Class</span>
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Academic Class</DialogTitle>
          <DialogDescription>
            Register a new grade cohort or classroom section.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="class-name" className="text-xs">
              Class Section Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="class-name"
              placeholder="e.g. Grade 10 - Section A"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <SelectTrigger size="sm" className="h-9 text-xs w-full">
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
              <Label htmlFor="academic-year" className="text-xs">
                Academic Year
              </Label>
              <Input
                id="academic-year"
                placeholder="2026-2027"
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
            <Label className="text-xs">Assign to School</Label>
            <Select
              items={[
                { value: "none", label: "Unassigned (Select Later)" },
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
              <SelectTrigger size="sm" className="h-9 text-xs w-full">
                <SelectValue placeholder="Select School" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">
                  Unassigned (Select Later)
                </SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-3 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? "Creating..." : "Save Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
