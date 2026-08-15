import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { isMedianApp } from "@/lib/median";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Finishing sign-in — Sir P.P Circle" },
      {
        name: "description",
        content: "Completing your Google sign-in and opening your study space.",
      },
      { property: "og:title", content: "Finishing sign-in — Sir P.P Circle" },
      { property: "og:description", content: "Completing your Google sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

type Phase = "working" | "handoff" | "error" | "done";

function readTokens() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const pick = (key: string) => hash.get(key) ?? query.get(key);
  return {
    accessToken: pick("access_token"),
    refreshToken: pick("refresh_token"),
    code: query.get("code"),
    errorText: pick("error_description") ?? pick("error"),
    isHandoff: query.get("handoff") === "1",
  };
}

function AuthCallback() {
  const navigate = useNavigate();
  const { session, profile, profileComplete, loading } = useAuth();
  const [phase, setPhase] = useState<Phase>("working");
  const [message, setMessage] = useState<string>("");
  const [appUrl, setAppUrl] = useState<string>("");

  const inApp = useMemo(() => (typeof window === "undefined" ? false : isMedianApp()), []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { accessToken, refreshToken, code, errorText, isHandoff } = readTokens();

      if (errorText) {
        // Never log tokens — only the provider's error text.
        console.error("[auth] oauth callback error:", errorText);
        setMessage("Google Sign-In couldn't be completed. Please try again.");
        setPhase("error");
        return;
      }

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
      } catch (error) {
        console.error("[auth] could not establish session", error);
        setMessage("Google Sign-In couldn't be completed. Please try again.");
        setPhase("error");
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!data.session) {
        setMessage("We couldn't find your sign-in session. Please try signing in again.");
        setPhase("error");
        return;
      }

      // Strip tokens out of the address bar as soon as the session exists.
      const clean = `${window.location.origin}/auth/callback`;
      window.history.replaceState({}, "", clean);

      if (isHandoff && !inApp) {
        // We are the system-browser leg of the Median flow: bounce back into the
        // app through the https callback (App Link) carrying the session.
        const back =
          `${window.location.origin}/auth/callback?app=1` +
          `#access_token=${encodeURIComponent(data.session.access_token)}` +
          `&refresh_token=${encodeURIComponent(data.session.refresh_token)}`;
        setAppUrl(back);
        setPhase("handoff");
        window.location.href = back;
        return;
      }

      setPhase("done");
    })();

    return () => {
      cancelled = true;
    };
  }, [inApp]);

  // Once the session + profile are loaded, send the user where they belong.
  useEffect(() => {
    if (phase !== "done" || loading || !session || !profile) return;
    void navigate({ to: profileComplete ? "/home" : "/complete-profile", replace: true });
  }, [phase, loading, session, profile, profileComplete, navigate]);

  if (phase === "error") {
    return (
      <Shell
        icon={<ShieldAlert className="size-6 text-destructive" />}
        title="Sign-in failed"
        text={message}
        action={
          <Link
            to="/"
            className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </Link>
        }
      />
    );
  }

  if (phase === "handoff") {
    return (
      <Shell
        icon={<Smartphone className="size-6 text-primary" />}
        title="Signed in with Google"
        text="Returning you to the Sir P.P Circle app. If nothing happens, tap the button below."
        action={
          <a
            href={appUrl}
            className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Open the app
          </a>
        }
      />
    );
  }

  return (
    <Shell
      icon={<Loader2 className="size-6 animate-spin text-primary" />}
      title="Finishing sign-in"
      text="Setting up your study space…"
    />
  );
}

function Shell({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="surface-card max-w-sm animate-fade-up p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent">
          {icon}
        </div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
