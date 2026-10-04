"use client";

import React, { useState } from "react";
import { GraduationCap, LucideIcon, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/context/AppSettingsContext";

export interface NavTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface StaffPortalLayoutProps {
  roleTitle?: string;
  tabs: NavTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  children: React.ReactNode;
}

export function StaffPortalLayout({
  tabs,
  activeTab,
  onTabChange,
  searchPlaceholder,
  onSearch,
  children,
}: StaffPortalLayoutProps) {
  const { user } = useAuth();
  const { logoUrl } = useAppSettings();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex justify-center text-foreground">
      {/* ── 550PX CONSTRAINED PORTAL CONTAINER ── */}
      <div className="w-full max-w-137.5 min-h-screen flex flex-col bg-background relative">
        {/* ── TOP BRAND HEADER WITH ALIGNED SEARCH ICON ── */}
        <header className="w-full p-4 pt-5 flex items-center justify-between">
          {searchOpen ? (
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  placeholder={searchPlaceholder || "Search Hello One..."}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-full bg-muted/60 border border-input focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  handleSearch("");
                }}
                className="h-8 px-2.5 text-xs font-medium rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {/* Brand: Logo + Hello One */}
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

              {/* Search Icon Aligned with Brand */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                title="Search"
                aria-label="Search"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
              >
                <Search className="h-4 w-4" />
              </button>
            </>
          )}
        </header>

        {/* ── NAV BAR: EXTENDED PILLED NAVIGATION ── */}
        <nav aria-label="Staff Navigation" className="w-full">
          <div className="w-full px-3 py-2">
            <div className="flex items-center gap-1 w-full bg-muted/50 p-1 rounded-full border border-border/40 overflow-x-auto scrollbar-none">
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
                    className={`relative flex-1 min-w-9 h-9 flex items-center justify-center rounded-full transition-all outline-hidden cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60 active:scale-95"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {typeof tab.badge !== "undefined" &&
                      Number(tab.badge) > 0 && (
                        <span
                          className={`absolute -top-1 -right-0.5 px-1 min-w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center leading-none ${
                            isActive
                              ? "bg-primary-foreground text-primary shadow-xs"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* ── MAIN CONTENT: CONSTRAINED TO 550PX ── */}
        <main className="flex-1 w-full p-4 sm:p-5 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
