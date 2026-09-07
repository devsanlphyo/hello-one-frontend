"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, BookOpen, CalendarCheck, LayoutDashboard, Settings, User as UserIcon } from "lucide-react";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAuth } from "@/context/AuthContext";

const ADMIN_ROLES = new Set(["admin", "director", "headmaster"]);

interface PortalHeaderProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export function PortalHeader({ currentTab, onTabChange }: PortalHeaderProps) {
  const pathname = usePathname();
  const { logoUrl } = useAppSettings();
  const { role } = useAuth();
  const isAdmin = ADMIN_ROLES.has((role || "").toLowerCase());

  const isProfileActive = pathname === "/profile" && (!currentTab || currentTab === "profile");
  const isClassesActive = currentTab === "classes";
  const isScheduleActive = currentTab === "schedule";
  const isSettingsActive = pathname === "/settings" || currentTab === "settings";

  return (
    <div className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md">
      {/* ─────────────────────────────────────────────────────────────
          TIER 1: BRAND ONLY AT TOP
          Clean, minimal, centered brand header with no other clutter.
      ───────────────────────────────────────────────────────────── */}
      <header className="w-full border-b py-3 px-4 flex items-center justify-center">
        <div className="flex items-center gap-2.5 select-none">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <GraduationCap className="h-4 w-4" />
            )}
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            School OS
          </span>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          TIER 2: NAV LINK ICONS ONLY
          Pure icons bar. Touch-friendly, zero text labels.
      ───────────────────────────────────────────────────────────── */}
      <nav className="w-full border-b bg-card/90 shadow-2xs">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around sm:justify-center sm:gap-6">
          {/* Profile Nav Icon */}
          {pathname === "/profile" && onTabChange ? (
            <button
              type="button"
              onClick={() => onTabChange("profile")}
              title="Profile"
              aria-label="Profile"
              className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all focus:outline-none ${
                isProfileActive
                  ? "bg-primary text-primary-foreground shadow-xs scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95"
              }`}
            >
              <UserIcon className="h-5 w-5" />
              {isProfileActive && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          ) : (
            <Link
              href="/profile"
              title="Profile"
              aria-label="Profile"
              className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all focus:outline-none ${
                isProfileActive
                  ? "bg-primary text-primary-foreground shadow-xs scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95"
              }`}
            >
              <UserIcon className="h-5 w-5" />
              {isProfileActive && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          )}

          {/* Classes Nav Icon */}
          {pathname === "/profile" && onTabChange ? (
            <button
              type="button"
              onClick={() => onTabChange("classes")}
              title="Classes"
              aria-label="Classes"
              className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all focus:outline-none ${
                isClassesActive
                  ? "bg-primary text-primary-foreground shadow-xs scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95"
              }`}
            >
              <BookOpen className="h-5 w-5" />
              {isClassesActive && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          ) : (
            <Link
              href="/profile?tab=classes"
              title="Classes"
              aria-label="Classes"
              className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all focus:outline-none ${
                isClassesActive
                  ? "bg-primary text-primary-foreground shadow-xs scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95"
              }`}
            >
              <BookOpen className="h-5 w-5" />
              {isClassesActive && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          )}

          {/* Schedule Nav Icon */}
          {pathname === "/profile" && onTabChange ? (
            <button
              type="button"
              onClick={() => onTabChange("schedule")}
              title="Schedule"
              aria-label="Schedule"
              className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all focus:outline-none ${
                isScheduleActive
                  ? "bg-primary text-primary-foreground shadow-xs scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95"
              }`}
            >
              <CalendarCheck className="h-5 w-5" />
              {isScheduleActive && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          ) : (
            <Link
              href="/profile?tab=schedule"
              title="Schedule"
              aria-label="Schedule"
              className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all focus:outline-none ${
                isScheduleActive
                  ? "bg-primary text-primary-foreground shadow-xs scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95"
              }`}
            >
              <CalendarCheck className="h-5 w-5" />
              {isScheduleActive && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          )}

          {/* Settings Nav Icon */}
          <Link
            href="/settings"
            title="Settings"
            aria-label="Settings"
            className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all focus:outline-none ${
              isSettingsActive
                ? "bg-primary text-primary-foreground shadow-xs scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95"
            }`}
          >
            <Settings className="h-5 w-5" />
            {isSettingsActive && (
              <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary" />
            )}
          </Link>

          {/* Admin Portal Nav Icon (For admin roles only, icon only) */}
          {isAdmin && (
            <Link
              href="/admin/users"
              title="Admin Dashboard"
              aria-label="Admin Dashboard"
              className="relative flex items-center justify-center w-11 h-11 rounded-xl text-primary hover:bg-primary/10 transition-all focus:outline-none active:scale-95"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
