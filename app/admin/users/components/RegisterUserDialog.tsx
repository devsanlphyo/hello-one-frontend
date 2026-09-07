"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser } from "@/lib/api/users";
import type { User, UserRole } from "../types/user.type";

export type RegisterUserData = {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
};

interface RegisterUserDialogProps {
  onSuccess?: (user: User) => void;
  trigger?: React.ReactElement;
}

export function RegisterUserDialog({
  onSuccess,
  trigger,
}: RegisterUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<RegisterUserData>({
    fullName: "",
    email: "",
    password: "",
    role: "teacher",
  });

  function handleUserData(key: keyof RegisterUserData, value: string) {
    setUser((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await createUser({
        fullName: user.fullName,
        email: user.email,
        password: user.password,
        role: user.role,
        status: "active",
      });

      toast.success(res.message || "User registered successfully");
      onSuccess?.(res.user);
      setUser({ fullName: "", email: "", password: "", role: "teacher" });
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to register user");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button
              size="sm"
              className="h-7 px-2 sm:px-3 text-xs"
              aria-label="Register User"
              title="Register User"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Register User</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Register User</DialogTitle>
              <DialogDescription>
                Create a new user account and assign a role.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="modal-full-name" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="modal-full-name"
              type="text"
              placeholder="Enter full name"
              required
              value={user.fullName}
              onChange={(e) => handleUserData("fullName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="modal-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="modal-email"
              type="email"
              placeholder="Enter email address"
              required
              value={user.email}
              onChange={(e) => handleUserData("email", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="modal-password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="modal-password"
              type="password"
              placeholder="Enter password"
              required
              value={user.password}
              onChange={(e) => handleUserData("password", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="modal-role" className="text-sm font-medium">
              Role
            </label>
            <Select
              value={user.role}
              onValueChange={(value) =>
                handleUserData("role", (value as UserRole) ?? "teacher")
              }
            >
              <SelectTrigger id="modal-role" className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="director">Director</SelectItem>
                <SelectItem value="headmaster">Headmaster</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="assistant">Assistant</SelectItem>
                <SelectItem value="officer">Officer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Registering..." : "Register User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
