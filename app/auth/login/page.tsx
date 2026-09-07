"use client";

import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const ADMIN_ROLES = new Set(["admin", "director", "headmaster"]);

const SEEDED_USERS = [
  {
    role: "Admin",
    email: "admin@school.edu",
    password: "password123",
    name: "Alexander Wright",
  },
  {
    role: "Director",
    email: "director@school.edu",
    password: "password123",
    name: "Eleanor Vance",
  },
  {
    role: "Headmaster",
    email: "headmaster@school.edu",
    password: "password123",
    name: "Marcus Holloway",
  },
  {
    role: "Teacher",
    email: "teacher@school.edu",
    password: "password123",
    name: "Sarah Jenkins",
  },
  {
    role: "Officer",
    email: "officer@school.edu",
    password: "password123",
    name: "Chloe Bennett",
  },
  {
    role: "Assistant",
    email: "assistant@school.edu",
    password: "password123",
    name: "Amina Al-Mansoor",
  },
];

function LoginForm() {
  const { login, isAuthenticated, role, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      const isAdmin = ADMIN_ROLES.has(role.toLowerCase());
      if (redirectParam && redirectParam.startsWith("/")) {
        if (redirectParam.startsWith("/admin") && !isAdmin) {
          router.replace("/profile");
        } else {
          router.replace(redirectParam);
        }
      } else {
        router.replace(isAdmin ? "/admin/users" : "/profile");
      }
    }
  }, [isLoading, isAuthenticated, role, redirectParam, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading session...</div>
      </div>
    );
  }

  const handleSelectSeededUser = (demoUser: (typeof SEEDED_USERS)[0]) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    setError(null);
    toast.info(`Filled credentials for ${demoUser.role} (${demoUser.name})`);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await login(email, password);

      if (!res.isSuccess) {
        const msg = res.message || "Invalid email or password";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success(res.message || "Login successful");
      // The useEffect above will handle redirection once AuthContext updates,
      // or we can immediately route:
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        const userRole = userData?.user?.role?.toLowerCase() || "";
        const isAdmin = ADMIN_ROLES.has(userRole);

        if (redirectParam && redirectParam.startsWith("/")) {
          if (redirectParam.startsWith("/admin") && !isAdmin) {
            router.push("/profile");
          } else {
            router.push(redirectParam);
          }
        } else {
          router.push(isAdmin ? "/admin/users" : "/profile");
        }
        router.refresh();
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to sign in";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="w-full shadow-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              School Management System
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* Seeded / Demo Accounts Section */}
        <Card className="border-dashed bg-card/60 backdrop-blur">
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Seeded Demo Accounts (Password: password123)</span>
            </div>
          </CardHeader>

          <CardContent className="pb-4 pt-0">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SEEDED_USERS.map((demo) => {
                const isSelected = email === demo.email;
                return (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => handleSelectSeededUser(demo)}
                    className={`flex flex-col items-start rounded-lg border p-2 text-left transition-all hover:bg-accent hover:text-accent-foreground ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border/80 bg-background/50"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-semibold">{demo.role}</span>
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate w-full">
                      {demo.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
