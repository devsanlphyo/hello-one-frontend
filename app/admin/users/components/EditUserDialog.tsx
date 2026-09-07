"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { removeUserAvatar, updateUser, uploadUserAvatar } from "@/lib/api/users";
import type { User, UserRole, UserStatus } from "../types/user.type";

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedUser: User) => void;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "teacher" as UserRole,
    status: "active" as UserStatus,
    password: "",
  });
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        role: user.role || "teacher",
        status: user.status || "active",
        password: "",
      });
      setCurrentAvatarUrl(user.avatarUrl || null);
    }
  }, [user]);

  function handleChange(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB standard size
    if (file.size > maxSize) {
      toast.error("Image file size exceeds 10MB standard limit.");
      e.target.value = "";
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const res = await uploadUserAvatar(user.id, file);
      if (res.isSuccess) {
        setCurrentAvatarUrl(res.user.avatarUrl ?? null);
        onSuccess?.(res.user);
        toast.success("User profile photo updated");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload profile photo");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id) return;
    try {
      setIsUploadingAvatar(true);
      const res = await removeUserAvatar(user.id);
      if (res.isSuccess) {
        setCurrentAvatarUrl(null);
        onSuccess?.(res.user);
        toast.success("User profile photo removed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove profile photo");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user?.id) {
      toast.error("User ID is missing");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await updateUser(user.id, payload);
      toast.success(res.message || "User updated successfully");
      onSuccess?.(res.user);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Edit User Profile</DialogTitle>
              <DialogDescription>
                Update user information, role permissions, and status.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* User profile photo manager */}
        <div className="flex items-center gap-3.5 p-3 rounded-lg border bg-muted/30">
          <Avatar className="size-12 border">
            <AvatarImage src={currentAvatarUrl || undefined} alt={formData.fullName} />
            <AvatarFallback className="font-semibold bg-primary/10 text-primary text-sm">
              {formData.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Profile Photo</p>
            <p className="text-[11px] text-muted-foreground">Standard 10MB (JPG, PNG, WEBP)</p>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={avatarInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="h-7 text-xs gap-1"
            >
              {isUploadingAvatar ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Upload className="size-3" />
              )}
              <span>{currentAvatarUrl ? "Change" : "Upload"}</span>
            </Button>
            {currentAvatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploadingAvatar}
                onClick={handleRemoveAvatar}
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                title="Remove photo"
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-full-name" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="edit-full-name"
              type="text"
              placeholder="Enter full name"
              required
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="edit-email"
              type="email"
              placeholder="Enter email address"
              required
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="edit-role" className="text-sm font-medium">
                Assigned Role
              </label>
              <Select
                value={formData.role}
                onValueChange={(val) =>
                  handleChange("role", (val as UserRole) ?? "teacher")
                }
              >
                <SelectTrigger id="edit-role" className="w-full">
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

            <div className="space-y-2">
              <label htmlFor="edit-status" className="text-sm font-medium">
                Account Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  handleChange("status", (val as UserStatus) ?? "active")
                }
              >
                <SelectTrigger id="edit-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspend">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-password" className="text-sm font-medium">
              Reset Password{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <Input
              id="edit-password"
              type="password"
              placeholder="Leave blank to keep current password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
            />
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
