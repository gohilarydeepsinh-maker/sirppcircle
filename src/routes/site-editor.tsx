import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Protected } from "@/components/AppShell";
import {
  DEFAULT_SETTINGS,
  useAppSettingsQuery,
  useSaveSettings,
  type AppSettings,
} from "@/lib/settings";
import { logActivity } from "@/lib/activity";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/site-editor")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Site editor — App customization" },
      {
        name: "description",
        content: "Owner-only editor for the app name, colours, welcome text and navigation labels.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Site editor — App customization" },
      { property: "og:description", content: "Owner-only app customization panel." },
    ],
  }),
  component: () => (
    <Protected roles={["owner"]}>
      <SiteEditorPage />
    </Protected>
  ),
});

type TextField = { key: keyof AppSettings; label: string; multiline?: boolean };

const BRAND: TextField[] = [
  { key: "appName", label: "App name" },
  { key: "collegeName", label: "College name" },
  { key: "tagline", label: "Tagline" },
  { key: "logoUrl", label: "Logo image URL" },
];

const COPY: TextField[] = [
  { key: "welcomeHeading", label: "Welcome heading" },
  { key: "welcomeText", label: "Welcome text", multiline: true },
  { key: "homeHeading", label: "Home heading" },
  { key: "homeText", label: "Home text", multiline: true },
];

const NAV: TextField[] = [
  { key: "navHome", label: "Home" },
  { key: "navBrowse", label: "Browse" },
  { key: "navUpload", label: "Upload" },
  { key: "navAdmin", label: "Admin" },
  { key: "navOwner", label: "Owner" },
  { key: "navProfile", label: "Profile" },
];

const COLORS: { key: keyof AppSettings; label: string }[] = [
  { key: "primaryColor", label: "Primary" },
  { key: "accentColor", label: "Accent" },
  { key: "backgroundColor", label: "Background" },
];

function SiteEditorPage() {
  const { user } = useAuth();
  const query = useAppSettingsQuery();
  const save = useSaveSettings();
  const [draft, setDraft] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);

  const set = (key: keyof AppSettings, value: string) =>
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

  return (
    <AppShell
      title="Site editor"
      subtitle="Owner-only app customization"
      backTo="/owner"
      actions={
        <button
          type="button"
          onClick={() => void submit()}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
        >
          <Save className="size-4" />
          {save.isPending ? "Saving" : "Save"}
        </button>
      }
    >
      <Section title="Brand">
        {BRAND.map((field) => (
          <TextInput key={field.key} field={field} value={draft[field.key]} onChange={set} />
        ))}
      </Section>

      <Section title="Colours">
        <div className="space-y-3">
          {COLORS.map((color) => (
            <div key={color.key} className="flex items-center gap-3">
              <input
                type="color"
                aria-label={`${color.label} colour`}
                value={/^#[0-9a-fA-F]{6}$/.test(draft[color.key]) ? draft[color.key] : "#3b5bdb"}
                onChange={(event) => set(color.key, event.target.value)}
                className="size-10 shrink-0 cursor-pointer rounded-full border border-input bg-card"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">{color.label}</p>
                <input
                  value={draft[color.key]}
                  onChange={(event) => set(color.key, event.target.value)}
                  placeholder="Default"
                  className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                aria-label={`Reset ${color.label}`}
                onClick={() => set(color.key, "")}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-input text-muted-foreground"
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

      <Section title="Page text">
        {COPY.map((field) => (
          <TextInput key={field.key} field={field} value={draft[field.key]} onChange={set} />
        ))}
      </Section>

      <Section title="Navigation labels">
        <div className="grid grid-cols-2 gap-3">
          {NAV.map((field) => (
            <TextInput key={field.key} field={field} value={draft[field.key]} onChange={set} />
          ))}
        </div>
      </Section>

      <div className="mt-6 flex flex-wrap gap-2 pb-4">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={save.isPending}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
        >
          <Save className="size-4" />
          Save changes
        </button>
        <button
          type="button"
          onClick={() => setDraft(DEFAULT_SETTINGS)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-input bg-card px-5 py-3 text-sm font-semibold"
        >
          Reset to defaults
        </button>
      </div>
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

function TextInput({
  field,
  value,
  onChange,
}: {
  field: TextField;
  value: string;
  onChange: (key: keyof AppSettings, value: string) => void;
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
