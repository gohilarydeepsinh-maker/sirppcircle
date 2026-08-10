import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell, Protected } from "@/components/AppShell";
import { DocumentCard } from "@/components/DocumentCard";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useDocuments, useStats } from "@/lib/data";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Campus Notes" },
      { name: "description", content: "Review pending uploads and monitor study material." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Campus Notes" },
      { property: "og:description", content: "Review pending uploads and monitor material." },
    ],
  }),
  component: () => (
    <Protected roles={["admin", "owner"]}>
      <AdminPage />
    </Protected>
  ),
});

function AdminPage() {
  const { user } = useAuth();
  const pending = useDocuments({ status: "pending", limit: 100 });
  const stats = useStats(true);
  const queryClient = useQueryClient();

  const decide = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("documents").update({ status }).eq("id", id);
    if (error) {
      toast.error("Could not update this document.");
      return;
    }
    await logActivity(user?.id, `document.${status}`, "document", id);
    toast.success(status === "approved" ? "Document approved" : "Document rejected");
    await queryClient.invalidateQueries();
  };

  return (
    <AppShell title="Admin" subtitle="Review and publish material">
      <section className="grid grid-cols-2 gap-3">
        {[
          { label: "Documents", value: stats.data?.documents },
          { label: "Pending", value: stats.data?.pending },
          { label: "Students", value: stats.data?.students },
          { label: "Captains", value: stats.data?.captains },
        ].map((item) => (
          <div key={item.label} className="surface-card px-4 py-3">
            <p className="text-2xl font-bold">{item.value ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-7">
        <h3 className="section-title">Pending approvals</h3>
        <div className="mt-3 space-y-3">
          {pending.isLoading ? (
            <ListSkeleton rows={3} />
          ) : (pending.data ?? []).length === 0 ? (
            <EmptyState title="Nothing to review" message="All uploads have been reviewed." />
          ) : (
            pending.data!.map((doc) => (
              <div key={doc.id} className="space-y-2">
                <DocumentCard doc={doc} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void decide(doc.id, "approved")}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
                  >
                    <Check className="size-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void decide(doc.id, "rejected")}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition-transform active:scale-95"
                  >
                    <X className="size-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
