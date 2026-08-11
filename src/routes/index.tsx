import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, BookOpenCheck, ShieldCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { FullScreenLoader } from "@/components/AppShell";
import { useSettings } from "@/lib/settings";

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
  const { loading, session, profileComplete, profile } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (loading || !session || !profile) return;
    void navigate({ to: profileComplete ? "/home" : "/complete-profile", replace: true });
  }, [loading, session, profile, profileComplete, navigate]);

  if (loading) return <FullScreenLoader />;
  if (session) return <FullScreenLoader label="Opening your study space" />;

  const signInWithGoogle = async () => {
    setSigningIn(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setSigningIn(false);
      toast.error("Unable to sign in. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/home" });
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background px-6 pb-10 pt-16">
      <div className="mx-auto w-full max-w-md animate-fade-up">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-lift)]">
          <GraduationCap className="size-7" />
        </span>
        <h1 className="mt-7 text-3xl font-bold leading-tight">{settings.welcomeHeading}</h1>
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
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          {signingIn ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
          {signingIn ? "Signing in" : "Continue with Google"}
        </button>
        <Link
          to="/admin-login"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-input bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-transform active:scale-[0.98]"
        >
          <ShieldCheck className="size-4" />
          Admin Login
        </Link>
        <p className="pt-1 text-center text-xs text-muted-foreground">
          Students and captains sign in with their college Google account.
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
