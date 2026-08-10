import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Protected } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useSemesters, useSubjects, useTopics, useUnits } from "@/lib/data";
import { logActivity } from "@/lib/activity";
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
  "mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";
const labelClass =
  "mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

function UploadPage() {
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  const [semesterId, setSemesterId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const semesters = useSemesters();
  const subjects = useSubjects(semesterId || null);
  const units = useUnits(subjectId || null);
  const topics = useTopics(unitId || null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!semesterId || !subjectId || !unitId || !topicId) {
      toast.error("Please choose semester, subject, unit and topic.");
      return;
    }
    const cleanTitle = title.trim();
    if (cleanTitle.length < 3 || cleanTitle.length > 120) {
      toast.error("Title must be 3–120 characters.");
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
    const fileError = validateFile(file);
    if (fileError) {
      toast.error(fileError);
      return;
    }

    setBusy(true);
    const safeName = sanitizeFileName(file.name);
    const path = `${semesterId}/${subjectId}/${unitId}/${topicId}/${Date.now()}-${safeName}`;
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
        unit_id: unitId,
        topic_id: topicId,
        file_name: safeName,
        file_path: path,
        file_size: file.size,
        file_type: extensionOf(file.name),
        mime_type: file.type || "application/octet-stream",
        uploaded_by: user!.id,
        ...(isStaff ? { status: "approved" as const } : {}),
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
    toast.success(isStaff ? "Document published" : "Sent for admin approval");
    void navigate({ to: "/profile" });
  };

  return (
    <AppShell title="Upload material" subtitle="Add notes for your subject" backTo="/home">
      <form onSubmit={submit} className="surface-card p-5">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <UploadCloud className="size-5" />
        </span>
        <p className="mt-4 text-sm text-muted-foreground">
          {isStaff
            ? "Your uploads are published immediately."
            : "Your upload will be reviewed by an admin before students can see it."}
        </p>

        <label className={labelClass}>Semester</label>
        <select
          value={semesterId}
          onChange={(event) => {
            setSemesterId(event.target.value);
            setSubjectId("");
            setUnitId("");
            setTopicId("");
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
          onChange={(event) => {
            setSubjectId(event.target.value);
            setUnitId("");
            setTopicId("");
          }}
          className={inputClass}
        >
          <option value="">Select subject</option>
          {(subjects.data ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <label className={labelClass}>Unit</label>
        <select
          value={unitId}
          disabled={!subjectId}
          onChange={(event) => {
            setUnitId(event.target.value);
            setTopicId("");
          }}
          className={inputClass}
        >
          <option value="">Select unit</option>
          {(units.data ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <label className={labelClass}>Topic</label>
        <select
          value={topicId}
          disabled={!unitId}
          onChange={(event) => setTopicId(event.target.value)}
          className={inputClass}
        >
          <option value="">Select topic</option>
          {(topics.data ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <label className={labelClass}>Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          className={inputClass}
        />

        <label className={labelClass}>Description (optional)</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={1000}
          rows={3}
          className={inputClass}
        />

        <label className={labelClass}>File (max 50 MB)</label>
        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-1.5 w-full rounded-xl border border-dashed border-input bg-background px-4 py-3 text-sm"
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? "Uploading" : "Upload document"}
        </button>
      </form>
    </AppShell>
  );
}
