import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Loader2, BookOpenCheck, ShieldCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { FullScreenLoader } from "@/components/AppShell";
import { useSettings } from "@/lib/settings";
import { AppLogo } from "@/components/AppLogo";
import { isEmbeddedWebView, isMedianApp, openInSystemBrowser } from "@/lib/median";


export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Campus Notes — College Study Material" },
      {
        name: "description",
        content:
          "Sign in to browse semester-wise subjects, units, topics and download approved college study material.",
      },
      { property: "og:title", content: "Campus Notes — College Study Material" },
      {
        property: "og:description",
        content: "Semester-wise study material for our college, shared and verified by admins.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { loading, session, profileComplete, profile, refreshProfile } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [waitingForBrowser, setWaitingForBrowser] = useState(false);

  useEffect(() => {
    if (loading || !session || !profile) return;
    void navigate({ to: profileComplete ? "/home" : "/complete-profile", replace: true });
  }, [loading, session, profile, profileComplete, navigate]);

  const startBrowserFlow = useCallback(async (handoff: boolean) => {
    setSigningIn(true);
    const redirect_uri = `${window.location.origin}/auth/callback${handoff ? "?handoff=1" : ""}`;
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri });
    if (result.error) {
      setSigningIn(false);
      console.error("[auth] google sign-in failed", result.error);
      toast.error("Google Sign-In couldn't be completed. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/auth/callback" });
  }, [navigate]);

  // When the app hands sign-in off to the system browser it opens this page with
  // ?googleSignIn=1 — start Google straight away in that real browser tab.
  useEffect(() => {
    if (typeof window === "undefined" || session) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("googleSignIn") !== "1" || isMedianApp()) return;
    void startBrowserFlow(true);
  }, [session, startBrowserFlow]);

  const signInWithGoogle = async () => {
    // Google rejects OAuth inside embedded WebViews (Median Android app), so we
    // send the user to the device browser and return through /auth/callback.
    if (isEmbeddedWebView()) {
      openInSystemBrowser(`${window.location.origin}/?googleSignIn=1`);
      setWaitingForBrowser(true);
      return;
    }
    await startBrowserFlow(false);
  };

  const checkSessionAfterBrowser = async () => {
    setSigningIn(true);
    await refreshProfile();
    setSigningIn(false);
  };

  if (loading) return <FullScreenLoader />;
  if (session) return <FullScreenLoader label={settings.loadingMessage} />;

  if (waitingForBrowser) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="surface-card max-w-sm animate-fade-up p-8 text-center">
          <h1 className="text-lg font-semibold">Continue in your browser</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Google sign-in opened in your browser for security. Finish signing in there — you'll
            come straight back here.
          </p>
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={checkSessionAfterBrowser}
              disabled={signingIn}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground press disabled:opacity-70"
            >
              {signingIn ? <Loader2 className="size-4 animate-spin" /> : null}
              I've signed in — continue
            </button>
            <button
              type="button"
              onClick={() => setWaitingForBrowser(false)}
              className="w-full rounded-full border border-input bg-card px-5 py-3 text-sm font-semibold press"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col justify-between bg-background px-6 pb-10 pt-16">
      <div className="mx-auto w-full max-w-md animate-fade-up">
        <AppLogo
          className="size-14 animate-float rounded-2xl shadow-[var(--shadow-lift)]"
          iconClassName="size-7"
        />
        {settings.collegeName ? (
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {settings.collegeName}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold leading-tight">{settings.welcomeHeading}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{settings.welcomeText}</p>

        <div className="mt-8 space-y-3">
          <Feature
            icon={<BookOpenCheck className="size-4" />}
            title="Organised by semester"
            text="Subjects, units and topics laid out clearly."
          />
          <Feature
            icon={<ShieldCheck className="size-4" />}
            title="Admin verified"
            text="Only approved material reaches students."
          />
          <Feature
            icon={<Download className="size-4" />}
            title="Read or download"
            text="Open PDFs and images in the app instantly."
          />
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-md space-y-3">
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={signingIn}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] press disabled:opacity-70"
        >
          {signingIn ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
          {signingIn ? "Signing in" : settings.loginButtonText}
        </button>
        <Link
          to="/admin-login"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-input bg-card px-6 py-3.5 text-sm font-semibold text-foreground press"
        >
          <ShieldCheck className="size-4" />
          {settings.loginAdminButtonText}
        </Link>
        <p className="pt-1 text-center text-xs text-muted-foreground">
          {settings.loginFooterText}
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="surface-card flex items-center gap-3 p-3.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="currentColor"
        d="M24 9.5c3.9 0 6.6 1.7 8.1 3.1l5.5-5.4C34.3 4 29.7 2 24 2 15.4 2 8 7 4.4 14.3l6.6 5.1C12.7 13.7 17.9 9.5 24 9.5Z"
      />
      <path
        fill="currentColor"
        opacity="0.7"
        d="M46 24.5c0-1.6-.1-2.8-.4-4H24v8h12.5c-.5 2.7-2 4.9-4.2 6.4l6.4 5c3.7-3.5 7.3-8.6 7.3-15.4Z"
      />
      <path
        fill="currentColor"
        opacity="0.5"
        d="M11 28.6a13.6 13.6 0 0 1 0-9.2l-6.6-5.1a22.1 22.1 0 0 0 0 19.4l6.6-5.1Z"
      />
      <path
        fill="currentColor"
        opacity="0.85"
        d="M24 46c5.9 0 10.9-1.9 14.7-5.3l-6.4-5c-1.8 1.2-4.2 2-8.3 2-6.1 0-11.3-4.2-13-9.9l-6.6 5.1C8 41 15.4 46 24 46Z"
      />
    </svg>
  );
}
