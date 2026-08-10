import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell, Protected } from "@/components/AppShell";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Role } from "@/lib/auth";
import { useProfiles, useStats } from "@/lib/data";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/owner")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Owner control — Campus Notes" },
      { name: "description", content: "Manage user roles and view app-wide statistics." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Owner control — Campus Notes" },
      { property: "og:description", content: "Manage user roles and app statistics." },
    ],
  }),
  component: () => (
    <Protected roles={["owner"]}>
      <OwnerPage />
    </Protected>
  ),
});

const ROLES: Role[] = ["student", "captain", "admin"];

function OwnerPage() {
  const { user, profile } = useAuth();
  const profiles = useProfiles(true);
  const stats = useStats(true);
  const queryClient = useQueryClient();

  const setRole = async (id: string, role: Role) => {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) {
      toast.error("Could not change this role.");
      return;
    }
    await logActivity(user?.id, "profile.role_change", "profile", id, { role });
    toast.success("Role updated");
    await queryClient.invalidateQueries();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", id);
    if (error) {
      toast.error("Could not update this account.");
      return;
    }
    await queryClient.invalidateQueries();
  };

  return (
    <AppShell title="Owner control" subtitle="Roles, users and statistics">
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Users", value: (stats.data?.students ?? 0) + (stats.data?.captains ?? 0) + (stats.data?.admins ?? 0) },
          { label: "Documents", value: stats.data?.documents },
          { label: "Subjects", value: stats.data?.subjects },
        ].map((item) => (
          <div key={item.label} className="surface-card px-3 py-3">
            <p className="text-xl font-bold">{item.value ?? "—"}</p>
            <p className="text-[0.7rem] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-7">
        <h3 className="section-title">Users</h3>
        <div className="mt-3 space-y-3">
          {profiles.isLoading ? (
            <ListSkeleton rows={4} />
          ) : (profiles.data ?? []).length === 0 ? (
            <EmptyState title="No users yet" />
          ) : (
            profiles.data!.map((item) => (
              <div key={item.id} className="surface-card p-4">
                <p className="truncate text-sm font-semibold">{item.name ?? "Unnamed"}</p>
                <p className="truncate text-xs text-muted-foreground">{item.email}</p>
                {item.id === profile?.id || item.role === "owner" ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.role}
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => void setRole(item.id, role)}
                        className={
                          item.role === role
                            ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                            : "rounded-full border border-input bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                        }
                      >
                        {role}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => void toggleActive(item.id, !item.is_active)}
                      className="rounded-full border border-input bg-card px-3 py-1.5 text-xs font-semibold"
                    >
                      {item.is_active ? "Disable" : "Enable"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
