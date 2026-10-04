"use client";

import React from "react";
import {
  User as UserIcon,
  Clock,
  CalendarRange,
  MessageSquare,
} from "lucide-react";
import { StaffPortalLayout, NavTabItem } from "@/components/portal/StaffPortalLayout";
import { StaffProfileTab } from "@/components/portal/StaffProfileTab";
import { CheckInOutWidget } from "@/components/attendance/CheckInOutWidget";
import { StaffLeaveRequestView } from "@/components/leaves/StaffLeaveRequestView";
import { FeedView } from "@/components/feed/FeedView";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AssistantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") || "feed";
  const validTabs = ["feed", "attendance", "leaves", "profile"];
  const activeTab = validTabs.includes(rawTab) ? rawTab : "feed";
  const setActiveTab = (tab: string) => router.replace(`?tab=${tab}`, { scroll: false });

  const tabs: NavTabItem[] = [
    { id: "feed", label: "Campus Feed", icon: MessageSquare },
    { id: "attendance", label: "Check In / Out", icon: Clock },
    { id: "leaves", label: "Leave Requests", icon: CalendarRange },
    { id: "profile", label: "Profile & Workstation", icon: UserIcon },
  ];

  return (
    <StaffPortalLayout
      roleTitle="Assistant"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── TAB: CAMPUS FEED ── */}
      {activeTab === "feed" && <FeedView />}

      {/* ── TAB: CHECK IN / CHECK OUT ── */}
      {activeTab === "attendance" && <CheckInOutWidget />}

      {/* ── TAB: LEAVE REQUESTS ── */}
      {activeTab === "leaves" && <StaffLeaveRequestView />}

      {/* ── TAB: PROFILE & WORKSTATION ── */}
      {activeTab === "profile" && <StaffProfileTab />}
    </StaffPortalLayout>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={null}>
      <AssistantContent />
    </Suspense>
  );
}

