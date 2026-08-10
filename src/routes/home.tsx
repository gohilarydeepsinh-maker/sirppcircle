import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, Upload, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell, Protected } from "@/components/AppShell";
import { DocumentCard } from "@/components/DocumentCard";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { useDocuments, useSemesters } from "@/lib/data";

export const Route = createFileRoute("/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Home — Campus Notes" },
      {
        name: "description",
        content: "Recently added study material and quick access to every semester.",
      },
      { property: "og:title", content: "Home — Campus Notes" },
      { property: "og:description", content: "Recently added college study material." },
    ],
  }),
  component: () => (
    <Protected>
      <HomePage />
    </Protected>
  ),
});

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function HomePage() {
  const { profile, canUpload, isStaff } = useAuth();
  const semesters = useSemesters();
  const recent = useDocuments({ recentOnly: false, limit: 6 });
  const firstName = (profile?.name ?? "there").split(" ")[0];

  return (
    <AppShell title="Campus Notes" subtitle={`${greeting()}, ${firstName}`}>
      <section className="surface-card overflow-hidden p-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-accent-foreground">
          <Sparkles className="size-3.5" />
          {profile?.role}
        </span>
        <h2 className="mt-3 text-xl font-bold leading-snug">
          Everything you need for this semester
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Browse by semester, subject, unit and topic — or jump straight to the newest notes.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            <LayoutGrid className="size-4" />
            Browse material
          </Link>
          {canUpload ? (
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95"
            >
              <Upload className="size-4" />
              Upload
            </Link>
          ) : null}
          {isStaff ? (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95"
            >
              <ShieldCheck className="size-4" />
              Admin
            </Link>
          ) : null}
        </div>
      </section>

      <section className="mt-7">
        <h3 className="section-title">Semesters</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {semesters.isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="surface-card h-20 animate-pulse bg-muted/40" />
              ))
            : (semesters.data ?? []).map((semester) => (
                <Link
                  key={semester.id}
                  to="/browse"
                  search={{ semester: semester.id }}
                  className="surface-card flex h-20 flex-col justify-center px-4 transition-transform active:scale-[0.98]"
                >
                  <span className="text-sm font-semibold">{semester.name}</span>
                  <span className="text-xs text-muted-foreground">View subjects</span>
                </Link>
              ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Recently added</h3>
          <Link to="/browse" className="text-xs font-semibold text-primary">
            See all
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {recent.isLoading ? (
            <ListSkeleton rows={3} />
          ) : (recent.data ?? []).length === 0 ? (
            <EmptyState
              title="No material yet"
              message="Approved notes will appear here as soon as they are published."
            />
          ) : (
            recent.data!.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
          )}
        </div>
      </section>
    </AppShell>
  );
}
