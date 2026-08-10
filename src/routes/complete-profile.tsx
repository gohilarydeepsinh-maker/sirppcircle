import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { FullScreenLoader } from "@/components/AppShell";

export const Route = createFileRoute("/complete-profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Complete your profile — Campus Notes" },
      { name: "description", content: "Add your name and roll number to start using Campus Notes." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Complete your profile — Campus Notes" },
      { property: "og:description", content: "Add your name and roll number to get started." },
    ],
  }),
  component: CompleteProfile,
});

function CompleteProfile() {
  const { loading, session, profile, profileComplete, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) void navigate({ to: "/", replace: true });
    else if (profileComplete) void navigate({ to: "/home", replace: true });
  }, [loading, session, profileComplete, navigate]);

  useEffect(() => {
    if (!profile) return;
    setName((current) => current || profile.name || "");
    setRoll((current) => current || profile.roll_number || "");
  }, [profile]);

  if (loading || !profile) return <FullScreenLoader />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedRoll = roll.trim();
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      toast.error("Please enter your full name (2–80 characters).");
      return;
    }
    if (trimmedRoll.length < 1 || trimmedRoll.length > 30) {
      toast.error("Please enter a valid roll number.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: trimmedName, roll_number: trimmedRoll })
      .eq("id", profile.id);
    if (error) {
      console.error(error);
      toast.error("Could not save your details. Please try again.");
      setBusy(false);
      return;
    }
    await refreshProfile();
    toast.success("Profile saved");
    void navigate({ to: "/home", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-14">
      <form onSubmit={submit} className="surface-card w-full max-w-sm animate-fade-up p-7">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <UserRound className="size-6" />
        </span>
        <h1 className="mt-5 text-xl font-bold">Complete your profile</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We only need your name and roll number to personalise your study space.
        </p>

        <label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Full name
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={80}
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Roll number
        </label>
        <input
          value={roll}
          onChange={(event) => setRoll(event.target.value)}
          required
          maxLength={30}
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? "Saving" : "Continue"}
        </button>
      </form>
    </div>
  );
}
