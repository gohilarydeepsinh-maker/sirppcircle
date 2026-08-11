import { useMemo, useState } from "react";
import { Search, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { useProfiles } from "@/lib/data";
import { logActivity } from "@/lib/activity";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function UserManager() {
  const { user, isOwner } = useAuth();
  const profiles = useProfiles(true);
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  /** Admins may only ever touch students and captains — never admins or the owner. */
  const manageable = useMemo(() => {
    const rows = (profiles.data ?? []).filter(
      (item) => item.role === "student" || item.role === "captain",
    );
    const query = term.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((item) =>
      [item.name, item.email, item.roll_number]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query)),
    );
  }, [profiles.data, term]);

  const update = async (
    id: string,
    patch: { role?: "student" | "captain"; is_active?: boolean },
    message: string,
  ) => {
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logActivity(user?.id, "profile.update", "profile", id, patch as never);
    toast.success(message);
    await queryClient.invalidateQueries();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search name, email or roll number"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {!isOwner ? (
        <p className="text-xs text-muted-foreground">
          Admins and the owner are not listed here and cannot be modified.
        </p>
      ) : null}

      {profiles.isLoading ? (
        <ListSkeleton rows={4} />
      ) : manageable.length === 0 ? (
        <EmptyState title="No students found" message="Try a different search." />
      ) : (
        manageable.map((item) => (
          <div key={item.id} className="surface-card p-4">
            <button
              type="button"
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
              className="flex w-full items-center gap-3 text-left"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  item.role === "captain"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {item.role === "captain" ? (
                  <ShieldCheck className="size-4" />
                ) : (
                  <UserRound className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {item.name ?? "Unnamed"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{item.email}</span>
              </span>
              <span className="shrink-0 text-[0.68rem] font-bold uppercase tracking-wide text-muted-foreground">
                {item.is_active ? item.role : "disabled"}
              </span>
            </button>

            {openId === item.id ? (
              <div className="mt-3 space-y-3 border-t border-border/70 pt-3">
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <Detail label="Roll number" value={item.roll_number ?? "—"} />
                  <Detail label="Branch / subject" value={item.subject ?? "—"} />
                  <Detail label="Role" value={item.role} />
                  <Detail label="Status" value={item.is_active ? "Active" : "Disabled"} />
                </dl>
                <div className="flex flex-wrap gap-2">
                  {item.role === "captain" ? (
                    <button
                      type="button"
                      onClick={() =>
                        void update(item.id, { role: "student" }, "Captain access revoked")
                      }
                      className="rounded-full border border-input bg-card px-3.5 py-2 text-xs font-semibold"
                    >
                      Revoke captain
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void update(item.id, { role: "captain" }, "Promoted to captain")}
                      className="rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"
                    >
                      Make captain
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      void update(
                        item.id,
                        { is_active: !item.is_active },
                        item.is_active ? "Account disabled" : "Account enabled",
                      )
                    }
                    className={cn(
                      "rounded-full px-3.5 py-2 text-xs font-semibold",
                      item.is_active
                        ? "border border-destructive/30 bg-destructive/10 text-destructive"
                        : "border border-input bg-card",
                    )}
                  >
                    {item.is_active ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
