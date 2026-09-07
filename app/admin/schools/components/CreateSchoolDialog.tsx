"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSchool } from "@/lib/api/schools";
import { fetchUsers } from "@/lib/api/users";
import type { User } from "@/app/admin/users/types/user.type";

interface CreateSchoolDialogProps {
  onSuccess: () => void;
}

export function CreateSchoolDialog({ onSuccess }: CreateSchoolDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [headmasters, setHeadmasters] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    headmasterId: "none",
  });

  useEffect(() => {
    if (open) {
      fetchUsers({ role: "headmaster", status: "active" })
        .then((res) => {
          if (res.isSuccess) {
            setHeadmasters(res.data);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("School Name and Code are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await createSchool({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        headmasterId:
          formData.headmasterId !== "none" ? formData.headmasterId : undefined,
      });

      if (res.isSuccess) {
        toast.success(res.message || "School created successfully");
        setFormData({
          name: "",
          code: "",
          headmasterId: "none",
        });
        setOpen(false);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create school");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="h-8 gap-1.5 text-xs shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add School</span>
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register New School</DialogTitle>
          <DialogDescription>
            Enter the details and assign a headmaster to the new school.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="school-name" className="text-xs">
              School Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="school-name"
              placeholder="e.g. West Oakridge High School"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="school-code" className="text-xs">
              School Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="school-code"
              placeholder="e.g. SCH-WOH-04"
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              className="h-9 text-sm uppercase"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Assign Headmaster</Label>
            <Select
              items={[
                { value: "none", label: "No Headmaster Assigned" },
                ...headmasters.map((h) => ({
                  value: h.id,
                  label: `${h.fullName} (${h.email})`,
                })),
              ]}
              value={formData.headmasterId}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  headmasterId: (val as string) ?? "none",
                }))
              }
            >
              <SelectTrigger size="sm" className="h-9 text-xs w-full">
                <SelectValue placeholder="Choose Headmaster" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">
                  No Headmaster Assigned
                </SelectItem>
                {headmasters.map((h) => (
                  <SelectItem key={h.id} value={h.id} className="text-xs">
                    {h.fullName}
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
              {loading ? "Creating..." : "Save School"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
