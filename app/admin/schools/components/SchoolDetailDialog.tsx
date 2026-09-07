"use client";

import { useEffect, useState } from "react";
import { BookOpen, Building2, GraduationCap, Layers, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchSchoolById, type School } from "@/lib/api/schools";

interface SchoolDetailDialogProps {
  schoolId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SchoolDetailDialog({
  schoolId,
  open,
  onOpenChange,
}: SchoolDetailDialogProps) {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && schoolId) {
      setLoading(true);
      fetchSchoolById(schoolId)
        .then((res) => {
          if (res.isSuccess) {
            setSchool(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setSchool(null);
    }
  }, [open, schoolId]);

  // Filter teachers out of the school's staff relation
  const teachers = school?.staff?.filter((s) => s.role === "teacher") ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {school?.name || "School Details"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Code: {school?.code}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading school profile...
          </div>
        ) : school ? (
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/30">
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Headmaster Leadership
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 font-medium text-foreground">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {school.headmaster?.fullName ||
                      school.principalName ||
                      "Not assigned"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">
                  School Status
                </span>
                <Badge
                  variant={school.status === "active" ? "default" : "destructive"}
                  className="mt-0.5 text-[10px] capitalize"
                >
                  {school.status}
                </Badge>
              </div>
            </div>

            {/* Assigned Teachers */}
            <div>
              <h4 className="font-semibold flex items-center gap-1.5 text-foreground mb-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span>Assigned Teachers ({teachers.length})</span>
              </h4>

              {teachers.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-card text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-primary shrink-0" />
                        <span className="font-medium text-foreground">
                          {teacher.fullName}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-[11px] truncate max-w-[140px]">
                        {teacher.email}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-3 text-center text-muted-foreground text-[11px]">
                  No teachers are currently assigned to this school.
                </div>
              )}
            </div>

            {/* Curriculum Subjects */}
            <div>
              <h4 className="font-semibold flex items-center gap-1.5 text-foreground mb-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span>Offered Curriculum Subjects ({school.subjects?.length || 0})</span>
              </h4>

              {school.subjects && school.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                  {school.subjects.map((sub) => (
                    <Badge key={sub.id} variant="secondary" className="text-[10px] py-0.5">
                      {sub.name} ({sub.code})
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-3 text-center text-muted-foreground text-[11px]">
                  No subjects currently added to this school curriculum.
                </div>
              )}
            </div>

            {/* Associated Classes */}
            <div>
              <h4 className="font-semibold flex items-center gap-1.5 text-foreground mb-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>Associated Classes ({school.classes?.length || 0})</span>
              </h4>

              {school.classes && school.classes.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {school.classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-card text-xs"
                    >
                      <div>
                        <span className="font-medium text-foreground">
                          {cls.name}
                        </span>
                        <span className="text-muted-foreground ml-2 text-[11px]">
                          ({cls.gradeLevel})
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {cls.academicYear}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-3 text-center text-muted-foreground text-[11px]">
                  No classes currently assigned to this school.
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
