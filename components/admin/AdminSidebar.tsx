"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookMarked,
  BookOpen,
  Building2,
  GraduationCap,
  Laptop,
  LogOut,
  Settings,
  User,
  Users,
  MessageSquare,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingDevicesCount } from "@/lib/api/devices";

interface AdminSidebarProps {
  current?:
    | "dashboard"
    | "users"
    | "schools"
    | "classes"
    | "subjects"
    | "devices"
    | "profile"
    | "settings"
    | "feed";
}

export function AdminSidebar({ current }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logoUrl } = useAppSettings();
  const { user, logout } = useAuth();
  const [pendingDevicesCount, setPendingDevicesCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const loadCount = async () => {
      try {
        const res = await fetchPendingDevicesCount();
        if (mounted && res.isSuccess) {
          setPendingDevicesCount(res.pendingCount || 0);
        }
      } catch {
        // silent fallback
      }
    };
    loadCount();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    {
      title: "School Feed",
      href: "/admin/feed",
      icon: MessageSquare,
      key: "feed",
      isActive: current === "feed" || pathname.startsWith("/admin/feed"),
    },
    {
      title: "Users Management",
      href: "/admin/users",
      icon: Users,
      key: "users",
      isActive: current === "users" || pathname.startsWith("/admin/users"),
    },
    {
      title: "Device Approvals",
      href: "/admin/devices",
      icon: Laptop,
      key: "devices",
      isActive: current === "devices" || pathname.startsWith("/admin/devices"),
      badge: pendingDevicesCount > 0 ? pendingDevicesCount : null,
    },
    {
      title: "Schools Management",
      href: "/admin/schools",
      icon: Building2,
      key: "schools",
      isActive: current === "schools" || pathname.startsWith("/admin/schools"),
    },
    {
      title: "Classes Management",
      href: "/admin/classes",
      icon: BookOpen,
      key: "classes",
      isActive: current === "classes" || pathname.startsWith("/admin/classes"),
    },
    {
      title: "Subjects Catalog",
      href: "/admin/subjects",
      icon: BookMarked,
      key: "subjects",
      isActive: current === "subjects" || pathname.startsWith("/admin/subjects"),
    },
    {
      title: "My Profile",
      href: "/admin/profile",
      icon: User,
      key: "profile",
      isActive: current === "profile" || pathname.startsWith("/admin/profile"),
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-12 items-center gap-2.5 px-3 border-b group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          {/* App logo — dynamic from Settings, fallback to icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="App Logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <GraduationCap className="h-5 w-5" />
            )}
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm tracking-tight">School OS</span>
            <span className="text-[10px] text-muted-foreground">Admin Portal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3">
            Core Modules
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      render={
                        <Link href={item.href} className="flex items-center gap-2.5 w-full">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge && (
                            <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-amber-500 text-white border-0 font-bold group-data-[collapsible=icon]:hidden">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      }
                      isActive={item.isActive}
                      tooltip={item.title}
                      className="font-medium text-xs h-9"
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <Link href="/admin/settings" className="flex items-center gap-2.5">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  }
                  isActive={current === "settings" || pathname.startsWith("/admin/settings")}
                  tooltip="Settings"
                  className="font-medium text-xs h-9"
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2 space-y-2">
        {user && (
          <div className="flex items-center gap-2.5 p-1.5 rounded-md bg-muted/50 text-xs group-data-[collapsible=icon]:justify-center">
            <Avatar className="size-7 shrink-0 border">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName} />
              <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                {user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-medium text-foreground truncate max-w-28">
                  {user.fullName}
                </span>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 uppercase shrink-0">
                  {user.role}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sign Out"
              className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 gap-2"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
