import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Protected } from "@/components/AppShell";
import { ContentManager } from "@/components/admin/ContentManager";
import { DocumentManager } from "@/components/admin/DocumentManager";
import { UserManager } from "@/components/admin/UserManager";
import {
  DEFAULT_SETTINGS,
  useAppSettingsQuery,
  useSaveSettings,
  type AppSettings,
} from "@/lib/settings";
import { logActivity } from "@/lib/activity";
import { useAuth } from "@/lib/auth";
import { AppLogo, UserAvatar } from "@/components/AppLogo";
import { uploadBrandingImage, useAssetUrl, validateImage } from "@/lib/assets";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/site-editor")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Site editor — Full control mode" },
      {
        name: "description",
        content:
          "Owner-only control centre for branding, colours, page text, navigation, academic structure, documents and users.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Site editor — Full control mode" },
      { property: "og:description", content: "Owner-only app control centre." },
    ],
  }),
  component: () => (
    <Protected roles={["owner"]}>
      <SiteEditorPage />
    </Protected>
  ),
});

type StringKey = {
  [K in keyof AppSettings]: AppSettings[K] extends string ? K : never;
}[keyof AppSettings];
type BoolKey = {
  [K in keyof AppSettings]: AppSettings[K] extends boolean ? K : never;
}[keyof AppSettings];
type NumberKey = {
  [K in keyof AppSettings]: AppSettings[K] extends number ? K : never;
}[keyof AppSettings];

type TextField = { key: StringKey; label: string; multiline?: boolean };

const BRAND: TextField[] = [
  { key: "appName", label: "App name" },
  { key: "collegeName", label: "College name" },
  { key: "tagline", label: "Tagline" },
  { key: "logoUrl", label: "Logo image URL" },
  { key: "faviconUrl", label: "Favicon URL" },
];

const LOGIN: TextField[] = [
  { key: "welcomeHeading", label: "Login heading" },
  { key: "welcomeText", label: "Login description", multiline: true },
  { key: "loginButtonText", label: "Google button text" },
  { key: "loginAdminButtonText", label: "Admin button text" },
  { key: "loginFooterText", label: "Footer note", multiline: true },
];

const HOME_TEXT: TextField[] = [
  { key: "homeHeading", label: "Home heading" },
  { key: "homeText", label: "Home text", multiline: true },
  { key: "homeAnnouncement", label: "Announcement banner", multiline: true },
  { key: "homeGreetingPrefix", label: "Greeting prefix" },
  { key: "sectionSemestersTitle", label: "Semesters section title" },
  { key: "sectionRecentTitle", label: "Recent section title" },
];

const HOME_TOGGLES: { key: BoolKey; label: string }[] = [
  { key: "showHomeHero", label: "Show hero card" },
  { key: "showQuickActions", label: "Show quick action buttons" },
  { key: "showSemesters", label: "Show semester grid" },
  { key: "showRecent", label: "Show recently added" },
];

const NAV: TextField[] = [
  { key: "navHome", label: "Home" },
  { key: "navBrowse", label: "Browse" },
  { key: "navUpload", label: "Upload" },
  { key: "navAdmin", label: "Admin" },
  { key: "navOwner", label: "Owner" },
  { key: "navProfile", label: "Profile" },
];

const SHARED_COPY: TextField[] = [
  { key: "emptyStateMessage", label: "Empty state message", multiline: true },
  { key: "loadingMessage", label: "Loading message" },
];

const COLORS: { key: StringKey; label: string }[] = [
  { key: "primaryColor", label: "Primary" },
  { key: "secondaryColor", label: "Secondary" },
  { key: "accentColor", label: "Accent" },
  { key: "backgroundColor", label: "Background" },
  { key: "textColor", label: "Text" },
];

const SLIDERS: { key: NumberKey; label: string; min: number; max: number; suffix: string }[] = [
  { key: "cardRadius", label: "Corner radius", min: 0, max: 32, suffix: "px" },
  { key: "shadowIntensity", label: "Shadow depth", min: 0, max: 200, suffix: "%" },
];

const UPLOAD_TEXT: TextField[] = [
  { key: "uploadInstructions", label: "Upload instructions", multiline: true },
  { key: "labelUnit", label: "Unit field label" },
  { key: "labelTopic", label: "Topic field label" },
];

const UPLOAD_TOGGLES: { key: BoolKey; label: string }[] = [
  { key: "captainUploadEnabled", label: "Captains can upload" },
  { key: "captainUploadRequiresApproval", label: "Captain uploads need approval" },
  { key: "showDescriptionField", label: "Show description field" },
  { key: "requireDescription", label: "Description is required" },
];

const FILTER_TOGGLES: { key: BoolKey; label: string }[] = [
  { key: "filterSearchEnabled", label: "Show search" },
  { key: "filterTypeEnabled", label: "Show file type filter" },
  { key: "filterRecentEnabled", label: "Show recent filter" },
];

const FILTER_TEXT: TextField[] = [
  { key: "filterTypeLabel", label: "File type filter label" },
  { key: "filterRecentLabel", label: "Recent filter label" },
];

const TABS = [
  { value: "appearance", label: "Appearance" },
  { value: "home", label: "Home" },
  { value: "login", label: "Login" },
  { value: "nav", label: "Navigation" },
  { value: "uploads", label: "Uploads" },
  { value: "academic", label: "Academic" },
  { value: "documents", label: "Documents" },
  { value: "users", label: "Users" },
] as const;

type Tab = (typeof TABS)[number]["value"];

function SiteEditorPage() {
  const { user } = useAuth();
  const query = useAppSettingsQuery();
  const save = useSaveSettings();
  const [draft, setDraft] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [tab, setTab] = useState<Tab>("appearance");

  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);

  const setText = (key: StringKey, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));
  const setBool = (key: BoolKey, value: boolean) => setDraft((prev) => ({ ...prev, [key]: value }));
  const setNumber = (key: NumberKey, value: number) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    try {
      await save.mutateAsync(draft);
      await logActivity(user?.id, "settings.update", "app_settings", null);
      toast.success("Saved for everyone");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings.");
    }
  };

  const settingsTab = tab !== "academic" && tab !== "documents" && tab !== "users";

  return (
    <AppShell
      title="Site editor"
      subtitle="Owner-only full control mode"
      backTo="/owner"
      actions={
        settingsTab ? (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={save.isPending}
            className="press inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Save className="size-4" />
            {save.isPending ? "Saving" : "Save"}
          </button>
        ) : null
      }
    >
      <div className="scroll-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
            className={cn(
              "press shrink-0 rounded-full px-4 py-2 text-xs font-semibold",
              tab === item.value
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-lift)]"
                : "border border-input bg-card text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-fade-up">
        {tab === "appearance" ? (
          <>
            <Section title="Brand">
              <LogoUpload
                value={draft.logoUrl}
                onChange={(next) => setText("logoUrl", next)}
              />
              {BRAND.map((field) => (
                <TextInput
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  onChange={setText}
                />
              ))}
            </Section>

            <Section title="Colours">
              <div className="space-y-3">
                {COLORS.map((color) => (
                  <div key={color.key} className="flex items-center gap-3">
                    <input
                      type="color"
                      aria-label={`${color.label} colour`}
                      value={
                        /^#[0-9a-fA-F]{6}$/.test(draft[color.key]) ? draft[color.key] : "#3b5bdb"
                      }
                      onChange={(event) => setText(color.key, event.target.value)}
                      className="size-10 shrink-0 cursor-pointer rounded-full border border-input bg-card"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{color.label}</p>
                      <input
                        value={draft[color.key]}
                        onChange={(event) => setText(color.key, event.target.value)}
                        placeholder="Default"
                        className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`Reset ${color.label}`}
                      onClick={() => setText(color.key, "")}
                      className="press flex size-9 shrink-0 items-center justify-center rounded-full border border-input text-muted-foreground"
                    >
                      <RotateCcw className="size-4" />
                    </button>
                  </div>
                ))}
                <p className="text-[0.7rem] text-muted-foreground">
                  Leave a colour empty to keep the built-in theme value.
                </p>
              </div>
            </Section>

            <Section title="Shape and depth">
              {SLIDERS.map((slider) => (
                <label key={slider.key} className="block">
                  <span className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    {slider.label}
                    <span className="text-foreground">
                      {draft[slider.key]}
                      {slider.suffix}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    value={draft[slider.key]}
                    onChange={(event) => setNumber(slider.key, Number(event.target.value))}
                    className="mt-2 w-full accent-[var(--primary)]"
                  />
                </label>
              ))}
            </Section>
          </>
        ) : null}

        {tab === "home" ? (
          <>
            <Section title="Home text">
              {HOME_TEXT.map((field) => (
                <TextInput
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  onChange={setText}
                />
              ))}
            </Section>
            <Section title="Sections">
              {HOME_TOGGLES.map((item) => (
                <Toggle
                  key={item.key}
                  label={item.label}
                  checked={draft[item.key]}
                  onChange={(next) => setBool(item.key, next)}
                />
              ))}
            </Section>
            <Section title="Shared copy">
              {SHARED_COPY.map((field) => (
                <TextInput
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  onChange={setText}
                />
              ))}
            </Section>
          </>
        ) : null}

        {tab === "login" ? (
          <Section title="Login screen">
            {LOGIN.map((field) => (
              <TextInput key={field.key} field={field} value={draft[field.key]} onChange={setText} />
            ))}
          </Section>
        ) : null}

        {tab === "nav" ? (
          <Section title="Navigation labels">
            <div className="grid grid-cols-2 gap-3">
              {NAV.map((field) => (
                <TextInput
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  onChange={setText}
                />
              ))}
            </div>
          </Section>
        ) : null}

        {tab === "uploads" ? (
          <>
            <Section title="Upload form">
              {UPLOAD_TEXT.map((field) => (
                <TextInput
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  onChange={setText}
                />
              ))}
              <label className="block">
                <span className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  Maximum file size
                  <span className="text-foreground">{draft.maxFileSizeMb} MB</span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={draft.maxFileSizeMb}
                  onChange={(event) => setNumber("maxFileSizeMb", Number(event.target.value))}
                  className="mt-2 w-full accent-[var(--primary)]"
                />
              </label>
            </Section>
            <Section title="Captain permissions">
              {UPLOAD_TOGGLES.map((item) => (
                <Toggle
                  key={item.key}
                  label={item.label}
                  checked={draft[item.key]}
                  onChange={(next) => setBool(item.key, next)}
                />
              ))}
            </Section>
            <Section title="Student filters">
              {FILTER_TOGGLES.map((item) => (
                <Toggle
                  key={item.key}
                  label={item.label}
                  checked={draft[item.key]}
                  onChange={(next) => setBool(item.key, next)}
                />
              ))}
              {FILTER_TEXT.map((field) => (
                <TextInput
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  onChange={setText}
                />
              ))}
            </Section>
          </>
        ) : null}

        {tab === "academic" ? (
          <Section title="Semesters, subjects, units and topics">
            <ContentManager />
          </Section>
        ) : null}

        {tab === "documents" ? (
          <Section title="Every document">
            <DocumentManager />
          </Section>
        ) : null}

        {tab === "users" ? (
          <Section title="Students, captains and admins">
            <UserManager scope="owner" />
          </Section>
        ) : null}
      </div>

      {settingsTab ? (
        <div className="mt-6 flex flex-wrap gap-2 pb-4">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={save.isPending}
            className="press inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-60"
          >
            <Save className="size-4" />
            Save changes
          </button>
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_SETTINGS)}
            className="press inline-flex items-center justify-center gap-2 rounded-full border border-input bg-card px-5 py-3 text-sm font-semibold"
          >
            Reset to defaults
          </button>
        </div>
      ) : null}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="section-title">{title}</h3>
      <div className="surface-card mt-3 space-y-3 p-4">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5 text-left"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-card shadow transition-transform duration-200",
            checked ? "translate-x-[1.4rem]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function TextInput({
  field,
  value,
  onChange,
}: {
  field: TextField;
  value: string;
  onChange: (key: StringKey, value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{field.label}</span>
      {field.multiline ? (
        <textarea
          value={value}
          rows={3}
          onChange={(event) => onChange(field.key, event.target.value)}
          className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(field.key, event.target.value)}
          className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
      )}
    </label>
  );
}

/** Owner-only college logo upload. Stores a private storage reference. */
function LogoUpload({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const preview = useAssetUrl(value);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateImage(file, 4);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      const ref = await uploadBrandingImage(file, "logo");
      onChange(ref);
      toast.success("Logo uploaded — press Save to publish it");
    } catch (error) {
      console.error(error);
      toast.error("Could not upload the logo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card">
        {preview ? (
          <img src={preview} alt="College logo" className="size-full object-contain" />
        ) : (
          <AppLogo className="size-full rounded-2xl" iconClassName="size-7" />
        )}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="press inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2 text-xs font-semibold disabled:opacity-60"
          >
            {busy ? "Uploading" : value ? "Replace logo" : "Upload logo"}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="press inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2 text-xs font-semibold text-muted-foreground"
            >
              Remove
            </button>
          ) : null}
        </div>
        <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
          Shown on the login screen, every page header and the app icon area.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(event) => void pick(event.target.files?.[0])}
      />
    </div>
  );
}
