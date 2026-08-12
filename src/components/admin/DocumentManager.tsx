import { useMemo, useState } from "react";
import { Check, Pencil, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { StatusBadge } from "@/components/DocumentCard";
import { FileIcon } from "@/components/FileIcon";
import { useDocuments, type DocStatus } from "@/lib/data";
import { logActivity } from "@/lib/activity";
import { useAuth } from "@/lib/auth";
import { formatBytes, formatDate } from "@/lib/files";
import { cn } from "@/lib/utils";

const TABS: { value: DocStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

/** Full document control: edit metadata, change status, delete. */
export function DocumentManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DocStatus | "all">("all");
  const [term, setTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");

  const documents = useDocuments({ status: tab, limit: 200 });

  const rows = useMemo(() => {
    const query = term.trim().toLowerCase();
    const list = documents.data ?? [];
    if (!query) return list;
    return list.filter((doc) =>
      [doc.title, doc.subjects?.name, doc.units?.name, doc.topics?.name]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query)),
    );
  }, [documents.data, term]);

  const refresh = () => queryClient.invalidateQueries();

  const setStatus = async (id: string, status: DocStatus) => {
    const { error } = await supabase.from("documents").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logActivity(user?.id, `document.${status}`, "document", id);
    toast.success(`Marked ${status}`);
    await refresh();
  };

  const saveMeta = async (id: string) => {
    const clean = titleDraft.trim();
    if (clean.length < 3) {
      toast.error("Title must be at least 3 characters.");
      return;
    }
    const { error } = await supabase
      .from("documents")
      .update({ title: clean, description: descDraft.trim() || null })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logActivity(user?.id, "document.update", "document", id);
    toast.success("Saved");
    setEditingId(null);
    await refresh();
  };

  const remove = async (id: string, filePath: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.storage.from("study-materials").remove([filePath]);
    await logActivity(user?.id, "document.delete", "document", id);
    toast.success("Document deleted");
    await refresh();
  };

  return (
    <div className="space-y-3">
      <div className="scroll-hide flex gap-2 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
            className={cn(
              "press shrink-0 rounded-full px-4 py-2 text-xs font-semibold",
              tab === item.value
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-card text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search documents"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {documents.isLoading ? (
        <ListSkeleton rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState title="No documents" message="Nothing matches this filter yet." />
      ) : (
        rows.map((doc) => (
          <div key={doc.id} className="surface-card animate-fade-up p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <FileIcon fileType={doc.file_type} />
              </span>
              <div className="min-w-0 flex-1">
                {editingId === doc.id ? (
                  <div className="space-y-2">
                    <input
                      value={titleDraft}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      maxLength={120}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <textarea
                      value={descDraft}
                      onChange={(event) => setDescDraft(event.target.value)}
                      rows={2}
                      maxLength={1000}
                      placeholder="Description"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveMeta(doc.id)}
                        className="press inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"
                      >
                        <Check className="size-3.5" /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="press inline-flex items-center gap-1.5 rounded-full border border-input px-3.5 py-2 text-xs font-semibold"
                      >
                        <X className="size-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="min-w-0 flex-1 truncate text-sm font-semibold">{doc.title}</h4>
                      <StatusBadge status={doc.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {[doc.semesters?.name, doc.subjects?.name, doc.units?.name, doc.topics?.name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1.5 text-[0.68rem] uppercase tracking-wide text-muted-foreground">
                      {doc.file_type} · {formatBytes(doc.file_size)} · {formatDate(doc.created_at)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {editingId === doc.id ? null : (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border/70 pt-3">
                {doc.status !== "approved" ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(doc.id, "approved")}
                    className="press rounded-full bg-success px-3.5 py-2 text-xs font-semibold text-success-foreground"
                  >
                    Approve
                  </button>
                ) : null}
                {doc.status !== "rejected" ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(doc.id, "rejected")}
                    className="press rounded-full border border-input bg-card px-3.5 py-2 text-xs font-semibold"
                  >
                    Reject
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(doc.id);
                    setTitleDraft(doc.title);
                    setDescDraft(doc.description ?? "");
                  }}
                  className="press inline-flex items-center gap-1.5 rounded-full border border-input bg-card px-3.5 py-2 text-xs font-semibold"
                >
                  <Pencil className="size-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => void remove(doc.id, doc.file_path)}
                  className="press inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
