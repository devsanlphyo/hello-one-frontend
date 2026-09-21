"use client";

import { useState } from "react";
import { Copy, MoreHorizontal, Pencil, ShieldAlert, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditUserDialog } from "./EditUserDialog";
import type { User } from "../types/user.type";

function getRoleBadgeVariant(role: User["role"]) {
  switch (role) {
    case "admin":
      return "default";
    case "headmaster":
    case "director":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusBadgeVariant(status: User["status"]) {
  switch (status) {
    case "active":
      return "default";
    case "suspend":
      return "destructive";
    default:
      return "outline";
  }
}

interface UsersTableProps {
  users: User[];
  loading?: boolean;
  onEditSuccess?: (user: User) => void;
  onSuspend?: (user: User) => void;
  onReactivate?: (user: User) => void;
}

export default function UsersTable({
  users,
  loading = false,
  onEditSuccess,
  onSuspend,
  onReactivate,
}: UsersTableProps) {
  const [userToSuspend, setUserToSuspend] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard");
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Full Name</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead className="w-28">Role</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="size-8 rounded-full shrink-0" />
                        <Skeleton className="h-5 w-28" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-44" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No users found matching the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((item, index) => (
                  <TableRow key={item.id || `${item.email}-${index}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 shrink-0 border">
                          <AvatarImage src={item.avatarUrl || undefined} alt={item.fullName} />
                          <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                            {item.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{item.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(item.role)}
                        className="capitalize"
                      >
                        {item.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.school?.name ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground border">
                          {item.school.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(item.status)}
                        className="capitalize"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 p-0"
                              aria-label="Actions"
                            >
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleCopyEmail(item.email)}
                            >
                              <Copy className="mr-2 size-4" />
                              Copy Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setUserToEdit(item);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 size-4" />
                              Edit User
                            </DropdownMenuItem>
                          </DropdownMenuGroup>

                          <DropdownMenuSeparator />

                          <DropdownMenuGroup>
                            {item.status === "suspend" ? (
                              <DropdownMenuItem
                                onClick={() => onReactivate?.(item)}
                                className="text-emerald-600"
                              >
                                <UserCheck className="mr-2 size-4" />
                                Re-activate User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setUserToSuspend(item)}
                              >
                                <UserX className="mr-2 size-4" />
                                Suspend User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Modal Dialog */}
      <EditUserDialog
        user={userToEdit}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={(updatedUser) => {
          onEditSuccess?.(updatedUser);
        }}
      />

      {/* Suspension Confirmation Dialog */}
      <AlertDialog
        open={!!userToSuspend}
        onOpenChange={(open) => {
          if (!open) setUserToSuspend(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <AlertDialogTitle>
                Suspend account for {userToSuspend?.fullName}?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Suspending{" "}
              <span className="font-semibold text-foreground">
                {userToSuspend?.fullName}
              </span>{" "}
              ({userToSuspend?.email}) will immediately revoke their ability to
              log in and access the system.
              <br />
              <br />
              <span className="text-xs text-muted-foreground">
                Note: No data will be permanently deleted. You can re-activate
                this user account at any time from this table.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!userToSuspend) return;
                onSuspend?.(userToSuspend);
                setUserToSuspend(null);
              }}
            >
              Suspend User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

