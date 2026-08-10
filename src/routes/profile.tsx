import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell, Protected } from "@/components/AppShell";
import { DocumentCard } from "@/components/DocumentCard";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMyUploads } from "@/lib/data";

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My profile — Campus Notes" },
      { name: "description", content: "Your account details and your uploaded study material." },
      { property: "og:title", content: "My profile — Campus Notes" },
      { property: "og:description", content: "Your account details and uploads." },
    ],
  }),
  component: () => (
    <Protected>
      <ProfilePage />
    </Protected>
  ),
});

function ProfilePage() {
  const { profile, canUpload, signOut } = useAuth();
  const uploads = useMyUploads(canUpload ? profile?.id : null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    await supabase.auth.signOut();
    void navigate({ to: "/", replace: true });
  };

  return (
    <AppShell title="My profile" subtitle={profile?.email ?? undefined}>
      <section className="surface-card p-5">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name ?? "Profile photo"}
              className="size-14 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
              {(profile?.name ?? "S").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-bold">{profile?.name ?? "Student"}</p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-accent px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-accent-foreground">
              {profile?.role}
            </span>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-muted/60 px-3 py-2">
            <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
              Roll number
            </dt>
            <dd className="mt-0.5 truncate font-medium">{profile?.roll_number ?? "—"}</dd>
          </div>
          <div className="rounded-xl bg-muted/60 px-3 py-2">
            <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
              Subject
            </dt>
            <dd className="mt-0.5 truncate font-medium">{profile?.subject ?? "—"}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-input bg-card px-5 py-2.5 text-sm font-semibold transition-transform active:scale-95"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </section>

      {canUpload ? (
        <section className="mt-7">
          <h3 className="section-title">My uploads</h3>
          <div className="mt-3 space-y-3">
            {uploads.isLoading ? (
              <ListSkeleton rows={3} />
            ) : (uploads.data ?? []).length === 0 ? (
              <EmptyState title="No uploads yet" message="Material you upload will appear here." />
            ) : (
              uploads.data!.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
            )}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
