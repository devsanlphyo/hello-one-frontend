"use client";

import React from "react";
import { GraduationCap, LogOut, LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/context/AppSettingsContext";

export interface NavTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface StaffPortalLayoutProps {
  roleTitle?: string;
  tabs: NavTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export function StaffPortalLayout({
  tabs,
  activeTab,
  onTabChange,
  children,
}: StaffPortalLayoutProps) {
  const { user, logout } = useAuth();
  const { logoUrl } = useAppSettings();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ── TOP BRAND HEADER: BRAND ONLY ── */}
      <header className="sticky top-0 z-40 w-full border-b py-3 px-4 flex items-center justify-center bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex items-center gap-2.5 select-none">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <GraduationCap className="h-4 w-4" />
            )}
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            Hello One
          </span>
        </div>
      </header>

      {/* ── NAV BAR: ICONS ONLY (NO TEXT) ── */}
      <nav
        aria-label="Staff Navigation"
        className="w-full border-b bg-card/90 shadow-2xs"
      >
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around sm:justify-center sm:gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
                aria-label={tab.label}
                className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all outline-hidden cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95"
                }`}
              >
                <Icon className="h-5 w-5" />
                {isActive && (
                  <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
