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
import { createSubject } from "@/lib/api/subjects";

interface CreateSubjectDialogProps {
  onSuccess: () => void;
  trigger?: React.ReactElement;
}

export function CreateSubjectDialog({
  onSuccess,
  trigger,
}: CreateSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Subject Name and Code are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await createSubject({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
      });

      if (res.isSuccess) {
        toast.success(res.message || "Academic subject created successfully");
        setFormData({ name: "", code: "" });
        setOpen(false);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create subject");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" className="h-8 gap-1.5 text-xs shadow-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Subject</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Academic Subject</DialogTitle>
          <DialogDescription>
            Register a new master academic subject for the institution curriculum.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="subject-name" className="text-xs">
              Subject Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject-name"
              placeholder="e.g. Advanced Chemistry"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject-code" className="text-xs">
              Subject Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject-code"
              placeholder="e.g. CHEM-12"
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

          <DialogFooter className="pt-3 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setOpen(false)}
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
              {loading ? "Creating..." : "Save Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
