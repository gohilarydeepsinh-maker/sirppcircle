import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, Upload, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell, Protected } from "@/components/AppShell";
import { DocumentCard } from "@/components/DocumentCard";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { useDocuments, useSemesters } from "@/lib/data";
import { useSettings } from "@/lib/settings";

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
  const settings = useSettings();
  const semesters = useSemesters();
  const recent = useDocuments({ recentOnly: false, limit: 6 });
  const firstName = (profile?.name ?? "there").split(" ")[0];

  return (
    <AppShell
      title={settings.appName}
      subtitle={`${settings.homeGreetingPrefix || greeting()}, ${firstName}`}
    >
      {settings.homeAnnouncement ? (
        <div className="academic-surface mb-4 animate-fade-up p-4 text-sm font-medium">
          {settings.homeAnnouncement}
        </div>
      ) : null}
      {settings.showHomeHero ? (
      <section className="academic-surface animate-fade-up overflow-hidden p-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-accent-foreground">
          <Sparkles className="size-3.5" />
          {profile?.role}
        </span>
        <h2 className="mt-3 text-xl font-bold leading-snug">
          {settings.homeHeading}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {settings.homeText}
        </p>
        {settings.showQuickActions ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/browse"
            className="press inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)]"
          >
            <LayoutGrid className="size-4" />
            {settings.navBrowse}
          </Link>
          {canUpload ? (
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2.5 text-sm font-semibold press "
            >
              <Upload className="size-4" />
              Upload
            </Link>
          ) : null}
          {isStaff ? (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2.5 text-sm font-semibold press "
            >
              <ShieldCheck className="size-4" />
              Admin
            </Link>
          ) : null}
        </div>
        ) : null}
      </section>
      ) : null}

      {settings.showSemesters ? (
      <section className="mt-7">
        <h3 className="section-title">{settings.sectionSemestersTitle}</h3>
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
                  className="surface-card press flex h-20 flex-col justify-center px-4 hover:shadow-[var(--shadow-lift)]"
                >
                  <span className="text-sm font-semibold">{semester.name}</span>
                  <span className="text-xs text-muted-foreground">View subjects</span>
                </Link>
              ))}
        </div>
      </section>
      ) : null}

      {settings.showRecent ? (
      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h3 className="section-title">{settings.sectionRecentTitle}</h3>
          <Link to="/browse" className="text-xs font-semibold text-primary">
            See all
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {recent.isLoading ? (
            <ListSkeleton rows={3} />
          ) : (recent.data ?? []).length === 0 ? (
            <EmptyState title="No material yet" message={settings.emptyStateMessage} />
          ) : (
            recent.data!.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
          )}
        </div>
      </section>
      ) : null}
    </AppShell>
  );
}
