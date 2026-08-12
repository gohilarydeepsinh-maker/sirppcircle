import { createContext, useContext, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SETTINGS_KEY = "global";

export type AppSettings = {
  /* Brand */
  appName: string;
  collegeName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;

  /* Appearance */
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  cardRadius: number;
  shadowIntensity: number;

  /* Login screen */
  welcomeHeading: string;
  welcomeText: string;
  loginButtonText: string;
  loginAdminButtonText: string;
  loginFooterText: string;

  /* Home screen */
  homeHeading: string;
  homeText: string;
  homeAnnouncement: string;
  homeGreetingPrefix: string;
  sectionSemestersTitle: string;
  sectionRecentTitle: string;
  showHomeHero: boolean;
  showQuickActions: boolean;
  showSemesters: boolean;
  showRecent: boolean;

  /* Navigation */
  navHome: string;
  navBrowse: string;
  navUpload: string;
  navAdmin: string;
  navOwner: string;
  navProfile: string;

  /* Shared copy */
  emptyStateMessage: string;
  loadingMessage: string;

  /* Uploads */
  uploadInstructions: string;
  labelUnit: string;
  labelTopic: string;
  maxFileSizeMb: number;
  captainUploadEnabled: boolean;
  captainUploadRequiresApproval: boolean;
  showDescriptionField: boolean;
  requireDescription: boolean;

  /* Filters shown to students */
  filterSearchEnabled: boolean;
  filterTypeEnabled: boolean;
  filterRecentEnabled: boolean;
  filterTypeLabel: string;
  filterRecentLabel: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  appName: "Campus Notes",
  collegeName: "",
  tagline: "College study material",
  logoUrl: "",
  faviconUrl: "",

  primaryColor: "",
  secondaryColor: "",
  accentColor: "",
  backgroundColor: "",
  textColor: "",
  cardRadius: 14,
  shadowIntensity: 100,

  welcomeHeading: "Campus Notes",
  welcomeText:
    "Your college study material in one calm place. Browse by semester, subject, unit and topic — then read or download verified notes.",
  loginButtonText: "Continue with Google",
  loginAdminButtonText: "Admin Login",
  loginFooterText: "Students and captains sign in with their college Google account.",

  homeHeading: "Everything you need for this semester",
  homeText: "Browse by semester, subject, unit and topic — or jump straight to the newest notes.",
  homeAnnouncement: "",
  homeGreetingPrefix: "",
  sectionSemestersTitle: "Semesters",
  sectionRecentTitle: "Recently added",
  showHomeHero: true,
  showQuickActions: true,
  showSemesters: true,
  showRecent: true,

  navHome: "Home",
  navBrowse: "Browse",
  navUpload: "Upload",
  navAdmin: "Admin",
  navOwner: "Owner",
  navProfile: "Profile",

  emptyStateMessage: "Approved notes will appear here as soon as they are published.",
  loadingMessage: "Loading your study space",

  uploadInstructions: "Type the unit and topic name exactly as it should appear to students.",
  labelUnit: "Unit name",
  labelTopic: "Topic name",
  maxFileSizeMb: 50,
  captainUploadEnabled: true,
  captainUploadRequiresApproval: true,
  showDescriptionField: true,
  requireDescription: false,

  filterSearchEnabled: true,
  filterTypeEnabled: true,
  filterRecentEnabled: true,
  filterTypeLabel: "File type",
  filterRecentLabel: "Recently added",
};

function merge(value: unknown): AppSettings {
  const raw = (value ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]) {
    const next = raw[key];
    const fallback = DEFAULT_SETTINGS[key];
    if (typeof fallback === "string") {
      if (typeof next === "string" && next.trim().length > 0) {
        (out[key] as string) = next;
      }
    } else if (typeof fallback === "boolean") {
      if (typeof next === "boolean") (out[key] as boolean) = next;
    } else if (typeof fallback === "number") {
      if (typeof next === "number" && Number.isFinite(next)) (out[key] as number) = next;
    }
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

/** Applies owner-defined colours, radius and depth to the live theme. */
function applyTheme(settings: AppSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const pairs: [string, string][] = [
    ["--primary", settings.primaryColor],
    ["--ring", settings.primaryColor],
    ["--secondary", settings.secondaryColor],
    ["--accent", settings.accentColor],
    ["--background", settings.backgroundColor],
    ["--foreground", settings.textColor],
  ];
  for (const [name, value] of pairs) {
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  }
  const readablePairs: [string, string][] = [
    ["--primary-foreground", settings.primaryColor],
    ["--secondary-foreground", settings.secondaryColor],
    ["--accent-foreground", settings.accentColor],
  ];
  for (const [name, source] of readablePairs) {
    if (source) root.style.setProperty(name, readableOn(source));
    else root.style.removeProperty(name);
  }
  root.style.setProperty("--radius", `${settings.cardRadius / 16}rem`);
  root.style.setProperty("--depth", String(Math.max(0, settings.shadowIntensity) / 100));

  if (settings.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = settings.faviconUrl;
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
