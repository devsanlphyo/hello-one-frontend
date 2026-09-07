"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignClassToSchool, type ClassItem } from "@/lib/api/classes";
import type { School } from "@/lib/api/schools";

interface AssignSchoolDialogProps {
  classItem: ClassItem | null;
  schools: School[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AssignSchoolDialog({
  classItem,
  schools,
  open,
  onOpenChange,
  onSuccess,
}: AssignSchoolDialogProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classItem) {
      setSelectedSchoolId(classItem.schoolId || (schools[0]?.id ?? ""));
    }
  }, [classItem, schools]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classItem?.id) return;
    if (!selectedSchoolId) {
      toast.error("Please select a target school.");
      return;
    }

    setLoading(true);
    try {
      const res = await assignClassToSchool(classItem.id, selectedSchoolId);
      if (res.isSuccess) {
        toast.success(res.message || "Class assigned to school successfully");
        onOpenChange(false);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to assign class to school");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Assign School
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select the school institution for &ldquo;{classItem?.name}&rdquo;
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleAssign} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Target School</Label>
            <Select
              items={schools.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.code})`,
              }))}
              value={selectedSchoolId}
              onValueChange={(val) => setSelectedSchoolId((val as string) ?? "")}
            >
              <SelectTrigger size="sm" className="h-9 text-xs">
                <SelectValue placeholder="Choose a school..." />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id} className="text-xs">
                    {school.name} ({school.code})
                  </SelectItem>
                ))}
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
              {loading ? "Assigning..." : "Assign School"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
