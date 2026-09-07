"use client";

import { useAuth } from "@/context/AuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LayoutDashboard,
  LogOut,
  Mail,
  Shield,
  User as UserIcon,
  Building2,
} from "lucide-react";
import Link from "next/link";

const ADMIN_ROLES = new Set(["admin", "director", "headmaster"]);

export default function ProfilePage() {
  const { user, role, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground text-sm">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full text-center p-6">
          <p className="text-muted-foreground mb-4">You are not logged in.</p>
          <Link href="/auth/login" className={buttonVariants({ className: "w-full" })}>
            Go to Login
          </Link>
        </Card>
      </div>
    );
  }

  const isAdmin = ADMIN_ROLES.has((role || "").toLowerCase());

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              User Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your personal credentials and view your portal access.
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/admin/users"
              className={buttonVariants({ variant: "default", className: "gap-2" })}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Admin Portal</span>
            </Link>
          )}
        </div>

        {/* Profile Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20">
              {user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl truncate">{user.fullName}</CardTitle>
                <Badge
                  variant={isAdmin ? "default" : "secondary"}
                  className="capitalize text-xs font-semibold"
                >
                  {user.role}
                </Badge>
                <Badge
                  variant={user.status === "active" ? "outline" : "destructive"}
                  className="capitalize text-[11px]"
                >
                  {user.status}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                School Staff Member
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card/60 p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email Address</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{user.email}</p>
              </div>

              <div className="rounded-lg border bg-card/60 p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span>System Role</span>
                </div>
                <p className="text-sm font-semibold capitalize text-foreground">
                  {user.role}
                </p>
              </div>

              <div className="rounded-lg border bg-card/60 p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Account Status</span>
                </div>
                <p className="text-sm font-semibold capitalize text-foreground">
                  {user.status}
                </p>
              </div>

              <div className="rounded-lg border bg-card/60 p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Assigned School</span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {user.schoolId ? `School ID: ${user.schoolId}` : "Not assigned"}
                </p>
              </div>
            </div>

            {/* Portal Access Notice */}
            <div className="rounded-lg border p-4 bg-muted/40">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Access Level & Permissions
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAdmin
                      ? "Your administrative role grants you full access to manage schools, classes, subjects, users, and platform settings in the Admin Portal."
                      : "You have staff access. To view or manage your assigned classes, students, and schedules, stay tuned as faculty modules are released. Administrative routes are reserved for directors and administrators."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-4">
            {isAdmin ? (
              <Link
                href="/admin/users"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Go to Admin Dashboard
              </Link>
            ) : (
              <div />
            )}

            <Button
              variant="destructive"
              size="sm"
              onClick={logout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
