import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Protected } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { FileIcon } from "@/components/FileIcon";
import { StatusBadge } from "@/components/DocumentCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useDocument } from "@/lib/data";
import { fileCategory, formatBytes, formatDate, isPreviewable } from "@/lib/files";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/document/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Study material — Campus Notes" },
      { name: "description", content: "Read or download this college study material." },
      { property: "og:title", content: "Study material — Campus Notes" },
      { property: "og:description", content: "Read or download this college study material." },
    ],
  }),
  component: () => (
    <Protected>
      <DocumentPage />
    </Protected>
  ),
});

function DocumentPage() {
  const { id } = Route.useParams();
  const { profile, isStaff, user } = useAuth();
  const document = useDocument(id);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const doc = document.data;

  useEffect(() => {
    if (!doc) return;
    let active = true;
    void (async () => {
      const { data, error } = await supabase.storage
        .from("study-materials")
        .createSignedUrl(doc.file_path, 60 * 60);
      if (!active) return;
      if (error || !data) {
        setUrlError(true);
        return;
      }
      setSignedUrl(data.signedUrl);
    })();
    return () => {
      active = false;
    };
  }, [doc]);

  if (document.isLoading) {
    return (
      <AppShell title="Loading" backTo="/browse">
        <div className="surface-card h-64 animate-pulse bg-muted/40" />
      </AppShell>
    );
  }

  if (!doc) {
    return (
      <AppShell title="Not found" backTo="/browse">
        <EmptyState
          title="Document not available"
          message="It may have been removed, or you don't have access to it."
          action={
            <Link to="/browse" className="text-xs font-semibold text-primary">
              Back to Browse
            </Link>
          }
        />
      </AppShell>
    );
  }

  const category = fileCategory(doc.file_type);
  const canDelete = isStaff || doc.uploaded_by === profile?.id;

  const remove = async () => {
    if (!window.confirm("Delete this document permanently?")) return;
    setDeleting(true);
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) {
      toast.error("Could not delete this document.");
      setDeleting(false);
      return;
    }
    await supabase.storage.from("study-materials").remove([doc.file_path]);
    await logActivity(user?.id, "document.delete", "document", doc.id, { title: doc.title });
    toast.success("Document deleted");
    window.history.back();
  };

  return (
    <AppShell title={doc.title} subtitle={doc.subjects?.name ?? undefined} backTo="/browse">
      <section className="surface-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <FileIcon fileType={doc.file_type} className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold leading-snug">{doc.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {doc.file_type.toUpperCase()} · {formatBytes(doc.file_size)} ·{" "}
              {formatDate(doc.created_at)}
            </p>
          </div>
          <StatusBadge status={doc.status} />
        </div>

        {doc.description ? (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {doc.description}
          </p>
        ) : null}

        <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <Meta label="Semester" value={doc.semesters?.name} />
          <Meta label="Subject" value={doc.subjects?.name} />
          <Meta label="Unit" value={doc.units?.name} />
          <Meta label="Topic" value={doc.topics?.name} />
          <Meta label="Uploaded by" value={doc.profiles?.name ?? doc.profiles?.email} />
          <Meta label="File" value={doc.file_name} />
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={signedUrl ?? undefined}
            download={doc.file_name}
            aria-disabled={!signedUrl}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 aria-disabled:pointer-events-none aria-disabled:opacity-60"
          >
            {signedUrl ? <Download className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
            Download
          </a>
          {signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-5 py-2.5 text-sm font-semibold transition-transform active:scale-95"
            >
              <ExternalLink className="size-4" />
              Open
            </a>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive transition-transform active:scale-95 disabled:opacity-60"
            >
              <Trash2 className="size-4" />
              Delete
            </button>
          ) : null}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="section-title">Preview</h3>
        <div className="surface-card mt-3 overflow-hidden">
          {urlError ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Preview unavailable right now.
            </div>
          ) : !signedUrl ? (
            <div className="h-72 animate-pulse bg-muted/40" />
          ) : !isPreviewable(category) ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              This file type can't be previewed in the app — download it to view.
            </div>
          ) : category === "image" ? (
            <img src={signedUrl} alt={doc.title} className="w-full object-contain" />
          ) : (
            <iframe
              src={signedUrl}
              title={doc.title}
              className="h-[70vh] w-full border-0 bg-card"
            />
          )}
        </div>
      </section>
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-xs font-medium">{value ?? "—"}</dd>
    </div>
  );
}
