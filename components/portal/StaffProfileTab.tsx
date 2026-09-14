"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDeviceName, getOrCreateDeviceId } from "@/lib/device";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Laptop, Mail, Shield, School, User as UserIcon, LogOut, CheckCircle2 } from "lucide-react";

export function StaffProfileTab() {
  const { user, logout } = useAuth();
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceName, setDeviceName] = useState<string>("");

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
    setDeviceName(getDeviceName());
  }, []);

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Staff Account &amp; Device Details</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review your credentials, academic affiliations, and authorized workstation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: User Card */}
        <Card className="md:col-span-1 shadow-xs">
          <CardHeader className="text-center pb-2">
            <Avatar className="h-20 w-20 mx-auto border-2 border-primary/20 shadow-sm">
              <AvatarImage src={user?.avatarUrl || undefined} alt={user?.fullName} />
              <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-base font-bold mt-3">{user?.fullName}</CardTitle>
            <CardDescription className="text-xs">{user?.email}</CardDescription>
            <div className="pt-2 flex justify-center">
              <Badge variant="secondary" className="capitalize text-xs font-semibold px-2.5 py-0.5">
                {user?.role}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pt-4 border-t text-xs">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <School className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-foreground font-medium truncate">
                {"Academic District Campus"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0 text-primary" />
              <span>Status: <span className="text-emerald-600 font-semibold uppercase text-[10px]">Active</span></span>
            </div>
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Workstation & Security Info */}
        <div className="md:col-span-2 space-y-4">
          <Card className="shadow-xs border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Current Workstation Device
                  </CardTitle>
                </div>
                <Badge className="text-[10px] bg-emerald-600 text-white font-medium gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Authorized
                </Badge>
              </div>
              <CardDescription className="text-xs">
                This browser session is securely recognized by the administration system.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg bg-background/80 border">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">Device Name</span>
                  <span className="font-semibold text-foreground truncate block">{deviceName || "Personal Computer"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">Unique Device Token</span>
                  <span className="font-mono text-[11px] text-muted-foreground truncate block">{deviceId || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Portal Access Guidelines</CardTitle>
              <CardDescription className="text-xs">
                Your role provides focused operational access without administrative overhead.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                • Your views and navigation tools are customized specifically for your role ({user?.role}).
              </p>
              <p>
                • System administration, user credential issuance, and platform configurations are managed centrally by system administrators.
              </p>
              <p>
                • For role changes or class reassignments, please coordinate with your campus administration.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
