import { createContext, useContext, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SETTINGS_KEY = "global";

export type AppSettings = {
  appName: string;
  collegeName: string;
  tagline: string;
  welcomeHeading: string;
  welcomeText: string;
  homeHeading: string;
  homeText: string;
  navHome: string;
  navBrowse: string;
  navUpload: string;
  navAdmin: string;
  navOwner: string;
  navProfile: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  logoUrl: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  appName: "Campus Notes",
  collegeName: "",
  tagline: "College study material",
  welcomeHeading: "Campus Notes",
  welcomeText:
    "Your college study material in one calm place. Browse by semester, subject, unit and topic — then read or download verified notes.",
  homeHeading: "Everything you need for this semester",
  homeText:
    "Browse by semester, subject, unit and topic — or jump straight to the newest notes.",
  navHome: "Home",
  navBrowse: "Browse",
  navUpload: "Upload",
  navAdmin: "Admin",
  navOwner: "Owner",
  navProfile: "Profile",
  primaryColor: "",
  accentColor: "",
  backgroundColor: "",
  logoUrl: "",
};

function merge(value: unknown): AppSettings {
  const raw = (value ?? {}) as Partial<Record<keyof AppSettings, unknown>>;
  const out = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]) {
    const next = raw[key];
    if (typeof next === "string" && next.trim().length > 0) out[key] = next;
  }
  return out;
}

export function useAppSettingsQuery() {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();
      if (error) throw error;
      return merge(data?.value);
    },
    staleTime: 60_000,
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (next: AppSettings) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: SETTINGS_KEY, value: next as never }, { onConflict: "key" });
      if (error) throw error;
      return next;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
}

const SettingsContext = createContext<AppSettings>(DEFAULT_SETTINGS);

/** Applies owner-defined colours to the live theme. */
function applyTheme(settings: AppSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const pairs: [string, string][] = [
    ["--primary", settings.primaryColor],
    ["--ring", settings.primaryColor],
    ["--accent", settings.accentColor],
    ["--background", settings.backgroundColor],
  ];
  for (const [name, value] of pairs) {
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  }
  if (settings.primaryColor) {
    root.style.setProperty("--primary-foreground", readableOn(settings.primaryColor));
  } else {
    root.style.removeProperty("--primary-foreground");
  }
  if (settings.accentColor) {
    root.style.setProperty("--accent-foreground", readableOn(settings.accentColor));
  } else {
    root.style.removeProperty("--accent-foreground");
  }
}

/** Rough luminance check so text stays legible on custom colours. */
export function readableOn(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 3 && value.length !== 6) return "#ffffff";
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "#111827" : "#ffffff";
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const query = useAppSettingsQuery();
  const settings = useMemo(() => query.data ?? DEFAULT_SETTINGS, [query.data]);

  useEffect(() => {
    applyTheme(settings);
  }, [settings]);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
