import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Protected } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useSemesters, useSubjects } from "@/lib/data";
import { logActivity } from "@/lib/activity";
import { useSettings } from "@/lib/settings";
import { sanitizeFileName, validateFile, extensionOf } from "@/lib/files";

export const Route = createFileRoute("/upload")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Upload material — Campus Notes" },
      { name: "description", content: "Upload notes and study documents for review." },
      { property: "og:title", content: "Upload material — Campus Notes" },
      { property: "og:description", content: "Upload notes and study documents for review." },
    ],
  }),
  component: () => (
    <Protected roles={["captain", "admin", "owner"]}>
      <UploadPage />
    </Protected>
  ),
});

const inputClass =
  "mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40";
const labelClass =
  "mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

/** Finds a row by name inside a parent, creating it when it does not exist yet. */
async function findOrCreate(
  table: "units" | "topics",
  parentColumn: "subject_id" | "unit_id",
  parentId: string,
  name: string,
): Promise<{ id: string } | { error: string }> {
  const trimmed = name.trim();
  const existing = await supabase
    .from(table)
    .select("id")
    .eq(parentColumn, parentId)
    .ilike("name", trimmed)
    .maybeSingle();
  if (existing.data?.id) return { id: existing.data.id };

  const last = await supabase
    .from(table)
    .select("display_order")
    .eq(parentColumn, parentId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const created = await supabase
    .from(table)
    .insert({
      name: trimmed,
      display_order: (last.data?.display_order ?? 0) + 1,
      [parentColumn]: parentId,
    } as never)
    .select("id")
    .maybeSingle();

  if (created.error || !created.data) {
    return {
      error:
        table === "units"
          ? "This unit does not exist yet and you do not have permission to create it. Ask an admin to add it."
          : "This topic does not exist yet and you do not have permission to create it. Ask an admin to add it.",
    };
  }
  return { id: created.data.id };
}

function UploadPage() {
  const { user, isStaff } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const [semesterId, setSemesterId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [unitName, setUnitName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const semesters = useSemesters();
  const subjects = useSubjects(semesterId || null);

  const uploadsLocked = !isStaff && !settings.captainUploadEnabled;
  const willNeedApproval = !isStaff && settings.captainUploadRequiresApproval;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || uploadsLocked) return;
    if (!semesterId || !subjectId) {
      toast.error("Please choose semester and subject.");
      return;
    }
    if (!unitName.trim() || !topicName.trim()) {
      toast.error("Please type the unit and topic name.");
      return;
    }
    const cleanTitle = title.trim();
    if (cleanTitle.length < 3 || cleanTitle.length > 120) {
      toast.error("Title must be 3–120 characters.");
      return;
    }
    if (settings.requireDescription && !description.trim()) {
      toast.error("Please add a description.");
      return;
    }
    if (description.length > 1000) {
      toast.error("Description must be under 1000 characters.");
      return;
    }
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    const fileError = validateFile(file, settings.maxFileSizeMb);
    if (fileError) {
      toast.error(fileError);
      return;
    }

    setBusy(true);

    const unit = await findOrCreate("units", "subject_id", subjectId, unitName);
    if ("error" in unit) {
      toast.error(unit.error);
      setBusy(false);
      return;
    }
    const topic = await findOrCreate("topics", "unit_id", unit.id, topicName);
    if ("error" in topic) {
      toast.error(topic.error);
      setBusy(false);
      return;
    }

    const safeName = sanitizeFileName(file.name);
    const path = `${semesterId}/${subjectId}/${unit.id}/${topic.id}/${Date.now()}-${safeName}`;
    const upload = await supabase.storage.from("study-materials").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (upload.error) {
      console.error(upload.error);
      toast.error("Upload failed. Please try again.");
      setBusy(false);
      return;
    }

    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({
        title: cleanTitle,
        description: description.trim() || null,
        semester_id: semesterId,
        subject_id: subjectId,
        unit_id: unit.id,
        topic_id: topic.id,
        file_name: safeName,
        file_path: path,
        file_size: file.size,
        file_type: extensionOf(file.name),
        mime_type: file.type || "application/octet-stream",
        uploaded_by: user!.id,
        ...(isStaff || !settings.captainUploadRequiresApproval
          ? { status: "approved" as const }
          : {}),
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(error);
      await supabase.storage.from("study-materials").remove([path]);
      toast.error("Could not save this document. Please try again.");
      setBusy(false);
      return;
    }

    await logActivity(user?.id, "document.upload", "document", inserted?.id ?? null, {
      title: cleanTitle,
    });
    toast.success(willNeedApproval ? "Sent for admin approval" : "Document published");
    void navigate({ to: "/profile" });
  };

  return (
    <AppShell title="Upload material" subtitle="Add notes for your subject" backTo="/home">
      <form onSubmit={submit} className="surface-card animate-fade-up p-5">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-lift)]">
          <UploadCloud className="size-5" />
        </span>
        <p className="mt-4 text-sm text-muted-foreground">
          {uploadsLocked
            ? "Captain uploads are currently turned off by the owner."
            : willNeedApproval
              ? "Your upload will be reviewed by an admin before students can see it."
              : "Your uploads are published immediately."}
        </p>
        {settings.uploadInstructions ? (
          <p className="mt-2 text-xs text-muted-foreground">{settings.uploadInstructions}</p>
        ) : null}

        <label className={labelClass}>Semester</label>
        <select
          value={semesterId}
          onChange={(event) => {
            setSemesterId(event.target.value);
            setSubjectId("");
          }}
          className={inputClass}
        >
          <option value="">Select semester</option>
          {(semesters.data ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <label className={labelClass}>Subject</label>
        <select
          value={subjectId}
          disabled={!semesterId}
          onChange={(event) => setSubjectId(event.target.value)}
          className={inputClass}
        >
          <option value="">Select subject</option>
          {(subjects.data ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <label className={labelClass} htmlFor="unit-name">
          {settings.labelUnit}
        </label>
        <input
          id="unit-name"
          type="text"
          value={unitName}
          onChange={(event) => setUnitName(event.target.value)}
          placeholder="Enter Unit Name..."
          maxLength={120}
          autoComplete="off"
          className={inputClass}
        />

        <label className={labelClass} htmlFor="topic-name">
          {settings.labelTopic}
        </label>
        <input
          id="topic-name"
          type="text"
          value={topicName}
          onChange={(event) => setTopicName(event.target.value)}
          placeholder="Enter Topic Name..."
          maxLength={120}
          autoComplete="off"
          className={inputClass}
        />

        <label className={labelClass}>Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          className={inputClass}
        />

        {settings.showDescriptionField ? (
          <>
            <label className={labelClass}>
              Description {settings.requireDescription ? "" : "(optional)"}
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={3}
              className={inputClass}
            />
          </>
        ) : null}

        <label className={labelClass}>File (max {settings.maxFileSizeMb} MB)</label>
        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-1.5 w-full rounded-xl border border-dashed border-input bg-background px-4 py-3 text-sm"
        />

        <button
          type="submit"
          disabled={busy || uploadsLocked}
          className="press mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? "Uploading" : "Upload document"}
        </button>
      </form>
    </AppShell>
  );
}
