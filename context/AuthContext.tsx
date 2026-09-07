"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string | null;
  schoolId?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ isSuccess: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUserAvatar: (avatarUrl: string | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ isSuccess: false }),
  logout: async () => {},
  refreshSession: async () => {},
  updateUserAvatar: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isAuthenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clean up any stale localStorage tokens from legacy auth
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
    refreshSession();
  }, [refreshSession]);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ isSuccess: boolean; message?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          isSuccess: false,
          message: data.message || "Failed to sign in",
        };
      }

      setUser(data.user);
      return { isSuccess: true, message: data.message };
    } catch (error: any) {
      return {
        isSuccess: false,
        message: error?.message || "An unexpected error occurred during login",
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
      router.push("/auth/login");
      router.refresh();
    }
  };

  const updateUserAvatar = (avatarUrl: string | null) => {
    setUser((prev) => (prev ? { ...prev, avatarUrl } : null));
  };

  const role = user?.role || null;
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshSession,
        updateUserAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
