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
import { updateSchool, type School, type SchoolStatus } from "@/lib/api/schools";
import { fetchUsers } from "@/lib/api/users";
import type { User } from "@/app/admin/users/types/user.type";

interface EditSchoolDialogProps {
  school: School | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditSchoolDialog({
  school,
  open,
  onOpenChange,
  onSuccess,
}: EditSchoolDialogProps) {
  const [loading, setLoading] = useState(false);
  const [headmasters, setHeadmasters] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    headmasterId: "none",
    status: "active" as SchoolStatus,
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

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || "",
        code: school.code || "",
        headmasterId: school.headmasterId || "none",
        status: school.status || "active",
      });
    }
  }, [school]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?.id) return;
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("School Name and Code are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateSchool(school.id, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        headmasterId:
          formData.headmasterId === "none" ? null : formData.headmasterId,
        status: formData.status,
      });

      if (res.isSuccess) {
        toast.success(res.message || "School updated successfully");
        onOpenChange(false);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update school");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit School</DialogTitle>
          <DialogDescription>
            Update configuration and headmaster leadership for this school.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-school-name" className="text-xs">
              School Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-school-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-school-code" className="text-xs">
              School Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-school-code"
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
            <Label className="text-xs">Assigned Headmaster</Label>
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

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              items={[
                { value: "active", label: "Active" },
                { value: "suspend", label: "Suspended" },
              ]}
              value={formData.status}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  status: (val as SchoolStatus) ?? "active",
                }))
              }
            >
              <SelectTrigger size="sm" className="h-9 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active" className="text-xs">Active</SelectItem>
                <SelectItem value="suspend" className="text-xs">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-3 flex flex-col-reverse sm:flex-row gap-2">
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
      </DialogContent>
    </Dialog>
  );
}
