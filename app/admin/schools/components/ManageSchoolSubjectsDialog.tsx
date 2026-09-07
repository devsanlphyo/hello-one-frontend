"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check } from "lucide-react";
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
import {
  assignSchoolSubjects,
  fetchSchoolSubjects,
  type School,
} from "@/lib/api/schools";
import { fetchSubjects, type Subject } from "@/lib/api/subjects";

interface ManageSchoolSubjectsDialogProps {
  school: School | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ManageSchoolSubjectsDialog({
  school,
  open,
  onOpenChange,
  onSuccess,
}: ManageSchoolSubjectsDialogProps) {
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    if (!school) return;
    setLoading(true);
    Promise.all([fetchSubjects(), fetchSchoolSubjects(school.id)])
      .then(([allRes, schoolRes]) => {
        if (allRes.isSuccess) {
          setAllSubjects(allRes.data);
        }
        if (schoolRes.isSuccess) {
          setSelectedSubjectIds(schoolRes.data.map((s) => s.id));
        }
      })
      .catch(() => {
        toast.error("Failed to load subjects curriculum");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open && school) {
      loadData();
    }
  }, [open, school]);

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  };

  const handleSave = async () => {
    if (!school?.id) return;
    setSaving(true);
    try {
      const res = await assignSchoolSubjects(school.id, selectedSubjectIds);
      if (res.isSuccess) {
        toast.success(res.message || "School subjects curriculum updated");
        onOpenChange(false);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update school subjects");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                School Subjects Curriculum
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select the subjects taught and offered at &ldquo;{school?.name}&rdquo;
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading curriculum subjects...
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="text-xs text-muted-foreground">
              Selected:{" "}
              <span className="font-semibold text-foreground">
                {selectedSubjectIds.length}
              </span>{" "}
              of {allSubjects.length} subjects
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {allSubjects.map((sub) => {
                const isSelected = selectedSubjectIds.includes(sub.id);
                return (
                  <button
                    type="button"
                    key={sub.id}
                    onClick={() => toggleSubject(sub.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground font-medium"
                        : "border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className={isSelected ? "text-foreground font-medium" : ""}>
                        {sub.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {sub.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : "Save Curriculum"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
