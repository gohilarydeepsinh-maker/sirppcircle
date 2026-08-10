import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { adminLogin } from "@/lib/admin-auth.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Login — Campus Notes" },
      { name: "description", content: "Administrator sign-in for Campus Notes study material." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Login — Campus Notes" },
      { property: "og:description", content: "Administrator sign-in for Campus Notes." },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { refreshProfile, session, isStaff } = useAuth();
  const login = useServerFn(adminLogin);
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session && isStaff) void navigate({ to: "/admin", replace: true });
  }, [session, isStaff, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await login({ data: { adminId: adminId.trim(), password } });
      if (!result.ok) {
        toast.error(result.error);
        setBusy(false);
        return;
      }
      const { error } = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      if (error) {
        toast.error("Unable to sign in. Please try again.");
        setBusy(false);
        return;
      }
      await refreshProfile();
      toast.success("Welcome back, Administrator");
      void navigate({ to: "/admin", replace: true });
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-14">
      <form onSubmit={submit} className="surface-card w-full max-w-sm animate-fade-up p-7">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="mt-5 text-xl font-bold">Admin Login</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your administrator credentials to manage study material.
        </p>

        <label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin ID
        </label>
        <input
          value={adminId}
          onChange={(event) => setAdminId(event.target.value)}
          autoComplete="username"
          inputMode="numeric"
          required
          maxLength={64}
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
        />

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          maxLength={200}
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? "Signing in" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => void navigate({ to: "/" })}
          className="mt-3 w-full rounded-full px-6 py-2.5 text-sm font-semibold text-muted-foreground"
        >
          Back
        </button>
      </form>
    </div>
  );
}
