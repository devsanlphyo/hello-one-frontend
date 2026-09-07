"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchSettings, type AppSettingsData } from "@/lib/api/settings";

interface AppSettingsContextValue {
  logoUrl: string | null;
  refreshSettings: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextValue>({
  logoUrl: null,
  refreshSettings: async () => {},
});

export function AppSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetchSettings();
      if (res.isSuccess) {
        setLogoUrl(res.data.logoUrl);
      }
    } catch {
      // Settings fetch failing should never crash the app
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <AppSettingsContext.Provider value={{ logoUrl, refreshSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextValue {
  return useContext(AppSettingsContext);
}
