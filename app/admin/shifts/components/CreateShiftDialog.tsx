"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createShift, type CreateShiftDto } from "@/lib/api/shifts";

interface CreateShiftDialogProps {
  onSuccess: () => void;
  trigger?: React.ReactElement;
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

export function CreateShiftDialog({ onSuccess, trigger }: CreateShiftDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateShiftDto>({
    name: "",
    code: "",
    startTime: "08:00",
    endTime: "16:00",
    description: "",
    color: "sky",
  });

  const handleNameChange = (name: string) => {
    // Auto-generate a clean slug code if user hasn't typed custom code
    const generatedCode = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({
      ...prev,
      name,
      code: prev.code === "" || prev.code === prev.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        ? generatedCode
        : prev.code,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Shift name and unique code are required");
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error("Start time and end time are required");
      return;
    }

    setLoading(true);
    try {
      await createShift({
        name: formData.name.trim(),
        code: formData.code.trim().toLowerCase(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        description: formData.description?.trim() || undefined,
        color: formData.color || "sky",
      });

      toast.success(`Shift "${formData.name}" created successfully`);
      setFormData({
        name: "",
        code: "",
        startTime: "08:00",
        endTime: "16:00",
        description: "",
        color: "sky",
      });
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create shift definition");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button size="sm" className="h-8 gap-1.5 text-xs shadow-xs font-medium">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Shift</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Shift Schedule</DialogTitle>
          <DialogDescription>
            Define institutional work hours and shift parameters for faculty members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="shift-name" className="text-xs font-medium">
              Shift Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shift-name"
              placeholder="e.g. Evening Shift, Morning Duty"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shift-code" className="text-xs font-medium">
              Shift Identifier Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shift-code"
              placeholder="e.g. evening, weekend-duty"
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value.toLowerCase() }))
              }
              className="h-9 text-sm lowercase font-mono"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Unique programmatic identifier for roster mapping.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-time" className="text-xs font-medium">
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start-time"
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
              <Label htmlFor="end-time" className="text-xs font-medium">
                End Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end-time"
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
                <SelectValue placeholder="Select Color Theme" />
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
            <Label htmlFor="description" className="text-xs font-medium">
              Description / Duty Scope
            </Label>
            <Textarea
              id="description"
              placeholder="e.g. Evening lab supervision, tutorials, and seminar oversight..."
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
              {loading ? "Creating..." : "Save Shift"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
