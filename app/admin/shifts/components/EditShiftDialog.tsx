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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateShift, type ShiftItem } from "@/lib/api/shifts";

interface EditShiftDialogProps {
  shift: ShiftItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const colorOptions = [
  { value: "sky", label: "Sky Blue", bg: "bg-sky-500" },
  { value: "amber", label: "Amber Gold", bg: "bg-amber-500" },
  { value: "indigo", label: "Indigo", bg: "bg-indigo-500" },
  { value: "emerald", label: "Emerald Green", bg: "bg-emerald-500" },
  { value: "rose", label: "Rose Red", bg: "bg-rose-500" },
  { value: "purple", label: "Royal Purple", bg: "bg-purple-500" },
  { value: "blue", label: "Navy Blue", bg: "bg-blue-600" },
];

export function EditShiftDialog({
  shift,
  open,
  onOpenChange,
  onSuccess,
}: EditShiftDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startTime: "08:00",
    endTime: "16:00",
    description: "",
    color: "sky",
    isActive: true,
  });

  useEffect(() => {
    if (shift) {
      setFormData({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        description: shift.description || "",
        color: shift.color || "sky",
        isActive: shift.isActive,
      });
    }
  }, [shift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift) return;

    if (!formData.name.trim()) {
      toast.error("Shift name is required");
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error("Start time and end time are required");
      return;
    }

    setLoading(true);
    try {
      await updateShift(shift.id, {
        name: formData.name.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        description: formData.description.trim() || undefined,
        color: formData.color,
        isActive: formData.isActive,
      });

      toast.success(`Shift "${formData.name}" updated successfully`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to update shift definition");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Shift Schedule</DialogTitle>
          <DialogDescription>
            Update operating hours, description, and status for this shift schedule.
          </DialogDescription>
        </DialogHeader>

        {shift && (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-shift-name" className="text-xs font-medium">
                Shift Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-shift-name"
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
                <Label htmlFor="edit-start-time" className="text-xs font-medium">
                  Start Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-start-time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-end-time" className="text-xs font-medium">
                  End Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-end-time"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Theme Color</Label>
                <Select
                  items={colorOptions.map((c) => ({
                    value: c.value,
                    label: c.label,
                  }))}
                  value={formData.color}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, color: (val as string) || "sky" }))
                  }
                >
                  <SelectTrigger size="sm" className="h-9 text-xs w-full">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((col) => (
                      <SelectItem key={col.value} value={col.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${col.bg}`} />
                          <span>{col.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Schedule Status</Label>
                <Select
                  items={[
                    { value: "true", label: "Active" },
                    { value: "false", label: "Inactive" },
                  ]}
                  value={formData.isActive ? "true" : "false"}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, isActive: val === "true" }))
                  }
                >
                  <SelectTrigger size="sm" className="h-9 text-xs w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Active
                    </SelectItem>
                    <SelectItem value="false" className="text-xs text-muted-foreground">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-xs font-medium">
                Description / Scope
              </Label>
              <Textarea
                id="edit-description"
                placeholder="Institutional duty description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="text-xs min-h-[60px] resize-none"
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
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
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
