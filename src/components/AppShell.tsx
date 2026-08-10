import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, GraduationCap, Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth, type Role } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

export function FullScreenLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}…</p>
    </div>
  );
}

/**
 * Client-side gate. Real permission enforcement lives in database policies —
 * this only keeps the UI honest.
 */
export function Protected({
  children,
  roles,
  requireProfile = true,
}: {
  children: ReactNode;
  roles?: Role[];
  requireProfile?: boolean;
}) {
  const { loading, session, profile, profileComplete, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      void navigate({ to: "/", replace: true });
      return;
    }
    if (requireProfile && profile && !profileComplete) {
      void navigate({ to: "/complete-profile", replace: true });
    }
  }, [loading, session, profile, profileComplete, requireProfile, navigate]);

  if (loading || !session || !profile) return <FullScreenLoader />;
  if (requireProfile && !profileComplete) return <FullScreenLoader label="Opening your profile" />;

  if (profile.is_active === false) {
    return (
      <Centered
        title="Account disabled"
        message="Your account has been disabled. Please contact your college administrator."
      />
    );
  }

  if (roles && role && !roles.includes(role)) {
    return (
      <Centered
        title="Access denied"
        message="You don't have permission to view this page."
        action={
          <Link
            to="/home"
            className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Back to Home
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}

function Centered({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="surface-card max-w-sm animate-fade-up p-8 text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  backTo,
  onBack,
  actions,
  children,
  showNav = true,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  onBack?: () => void;
  actions?: ReactNode;
  children: ReactNode;
  showNav?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3.5">
          {backTo || onBack ? (
            <button
              type="button"
              aria-label="Go back"
              onClick={() => (onBack ? onBack() : void navigate({ to: backTo! }))}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-transform active:scale-90"
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {actions}
        </div>
      </header>
      <main className={cn("page-shell animate-fade-up pt-5")}>{children}</main>
      {showNav ? <BottomNav /> : null}
    </div>
  );
}
