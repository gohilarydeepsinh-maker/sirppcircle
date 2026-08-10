import { Link } from "@tanstack/react-router";
import { FileIcon } from "@/components/FileIcon";
import { formatBytes, formatDate } from "@/lib/files";
import type { DocumentWithNames } from "@/lib/data";
import { cn } from "@/lib/utils";

export function DocumentCard({ doc }: { doc: DocumentWithNames }) {
  return (
    <Link
      to="/document/$id"
      params={{ id: doc.id }}
      className="surface-card flex items-start gap-3 p-4 transition-transform duration-200 hover:shadow-[var(--shadow-lift)] active:scale-[0.99]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <FileIcon fileType={doc.file_type} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{doc.title}</h3>
          {doc.status !== "approved" ? <StatusBadge status={doc.status} /> : null}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {[doc.subjects?.name, doc.units?.name, doc.topics?.name].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          {doc.file_type} · {formatBytes(doc.file_size)} · {formatDate(doc.created_at)}
        </p>
      </div>
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
        status === "approved" && "bg-success/15 text-success",
        status === "pending" && "bg-warning/25 text-warning-foreground",
        status === "rejected" && "bg-destructive/12 text-destructive",
      )}
    >
      {status}
    </span>
  );
}
