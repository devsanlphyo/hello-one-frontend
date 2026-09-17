"use client";

import { useEffect, useState } from "react";
import { Plus, UserCheck } from "lucide-react";
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
import {
  assignTeacherShift,
  type ShiftItem,
  type TeacherWithShift,
} from "@/lib/api/shifts";

interface AssignFacultyShiftDialogProps {
  shifts: ShiftItem[];
  teachers: TeacherWithShift[];
  selectedTeacher?: TeacherWithShift | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess: () => void;
  trigger?: React.ReactElement;
}

export function AssignFacultyShiftDialog({
  shifts,
  teachers,
  selectedTeacher,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
  trigger,
}: AssignFacultyShiftDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled && setControlledOpen ? setControlledOpen : setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [semester, setSemester] = useState("Fall 2026 Semester");
  const [notes, setNotes] = useState("");

  const activeShifts = shifts.filter((s) => s.isActive);

  useEffect(() => {
    if (open) {
      if (selectedTeacher) {
        setTeacherId(selectedTeacher.id);
        setShiftId(selectedTeacher.assignment?.shiftId || (activeShifts[0]?.id ?? ""));
        setSemester(selectedTeacher.assignment?.semester || "Fall 2026 Semester");
        setNotes(selectedTeacher.assignment?.notes || "");
      } else {
        setTeacherId(teachers[0]?.id || "");
        setShiftId(activeShifts[0]?.id || "");
        setSemester("Fall 2026 Semester");
        setNotes("");
      }
    }
  }, [open, selectedTeacher, teachers, shifts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) {
      toast.error("Please select a teacher");
      return;
    }
    if (!shiftId) {
      toast.error("Please select a shift schedule");
      return;
    }

    setLoading(true);
    try {
      await assignTeacherShift({
        teacherId,
        shiftId,
        semester: semester.trim() || "Fall 2026 Semester",
        notes: notes.trim() || undefined,
      });

      toast.success("Faculty shift assignment saved successfully");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign faculty shift");
    } finally {
      setLoading(false);
    }
  };

  const currentTeacherObj =
    selectedTeacher || teachers.find((t) => t.id === teacherId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            trigger || (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                <UserCheck className="h-3.5 w-3.5" />
                <span>Assign Shift</span>
              </Button>
            )
          }
        />
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedTeacher ? "Reassign Faculty Shift" : "Allocate Faculty Shift"}
          </DialogTitle>
          <DialogDescription>
            Assign a faculty member to a designated work shift for the academic semester.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {selectedTeacher ? (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {selectedTeacher.fullName}
                </span>
                {selectedTeacher.school?.name && (
                  <span className="text-[11px] text-muted-foreground">
                    {selectedTeacher.school.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{selectedTeacher.email}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Select Teacher <span className="text-destructive">*</span>
              </Label>
              <Select
                items={teachers.map((t) => ({
                  value: t.id,
                  label: `${t.fullName} (${t.school?.name || "Unassigned Campus"})`,
                }))}
                value={teacherId}
                onValueChange={(val) => setTeacherId((val as string) || "")}
              >
                <SelectTrigger size="sm" className="h-9 text-xs w-full">
                  <SelectValue placeholder="Choose Teacher" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span>{t.fullName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {t.school?.name || "General"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Target Shift Schedule <span className="text-destructive">*</span>
            </Label>
            <Select
              items={activeShifts.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.startTime} - ${s.endTime})`,
              }))}
              value={shiftId}
              onValueChange={(val) => setShiftId((val as string) || "")}
            >
              <SelectTrigger size="sm" className="h-9 text-xs w-full">
                <SelectValue placeholder="Choose Shift" />
              </SelectTrigger>
              <SelectContent>
                {activeShifts.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground text-[11px]">
                        ({s.startTime} - {s.endTime})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="semester" className="text-xs font-medium">
              Academic Semester
            </Label>
            <Input
              id="semester"
              placeholder="e.g. Fall 2026 Semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-medium">
              Administrative Notes
            </Label>
            <Input
              id="notes"
              placeholder="e.g. Assigned for core laboratory coverage"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-sm"
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
              {loading ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
