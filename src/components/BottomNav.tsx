import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Upload, User, ShieldCheck, Crown, Palette } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Home };

export function BottomNav() {
  const { role, canUpload, isStaff, isOwner } = useAuth();
  const settings = useSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!role) return null;

  const items: NavItem[] = [
    { to: "/home", label: settings.navHome, icon: Home },
    { to: "/browse", label: settings.navBrowse, icon: LayoutGrid },
  ];
  if (canUpload) items.push({ to: "/upload", label: settings.navUpload, icon: Upload });
  if (isStaff) items.push({ to: "/admin", label: settings.navAdmin, icon: ShieldCheck });
  if (isOwner) {
    items.push({ to: "/owner", label: settings.navOwner, icon: Crown });
    items.push({ to: "/site-editor", label: "Editor", icon: Palette });
  }
  items.push({ to: "/profile", label: settings.navProfile, icon: User });

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="liquid-nav pointer-events-auto flex items-center gap-0.5 rounded-full px-2 py-2">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={cn(
                "relative flex min-w-[3.75rem] flex-col items-center gap-1 rounded-full px-3 py-2 text-[0.68rem] font-semibold transition-transform duration-200 active:scale-95",
                active ? "text-primary-foreground" : "text-primary-foreground/65",
              )}
            >
              {active && (
                <span className="absolute inset-0 -z-10 animate-pop rounded-full bg-[oklch(1_0_0/0.22)] shadow-[inset_0_1px_0_oklch(1_0_0/0.35)]" />
              )}
              <Icon
                className={cn(
                  "size-5 transition-transform duration-200",
                  active && "-translate-y-px scale-110",
                )}
                strokeWidth={active ? 2.4 : 2}
              />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
