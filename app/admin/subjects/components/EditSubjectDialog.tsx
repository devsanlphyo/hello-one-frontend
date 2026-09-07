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
import { updateSubject, type Subject, type SubjectStatus } from "@/lib/api/subjects";

interface EditSubjectDialogProps {
  subject: Subject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditSubjectDialog({
  subject,
  open,
  onOpenChange,
  onSuccess,
}: EditSubjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    status: "active" as SubjectStatus,
  });

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || "",
        code: subject.code || "",
        status: subject.status || "active",
      });
    }
  }, [subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject?.id) return;
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Subject Name and Code are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateSubject(subject.id, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        status: formData.status,
      });

      if (res.isSuccess) {
        toast.success(res.message || "Subject updated successfully");
        onOpenChange(false);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update subject");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Academic Subject</DialogTitle>
          <DialogDescription>
            Modify subject name, official curriculum code, or status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-subject-name" className="text-xs">
              Subject Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-subject-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-subject-code" className="text-xs">
              Subject Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-subject-code"
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
                  status: (val as SubjectStatus) ?? "active",
                }))
              }
            >
              <SelectTrigger size="sm" className="w-full h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active" className="text-xs">Active</SelectItem>
                <SelectItem value="archived" className="text-xs">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-3 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
