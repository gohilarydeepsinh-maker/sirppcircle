import { GraduationCap } from "lucide-react";
import { useAssetUrl } from "@/lib/assets";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

/** Global college logo. Falls back to the academic mark when no logo is set. */
export function AppLogo({
  className,
  iconClassName,
}: {
  className?: string | undefined;
  iconClassName?: string | undefined;
}) {
  const settings = useSettings();
  const src = useAssetUrl(settings.logoUrl);

  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={`${settings.appName} logo`}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <GraduationCap className={cn("size-5", iconClassName)} />
      )}
    </span>
  );
}

/** Profile photo with initial fallback. */
export function UserAvatar({
  name,
  url,
  className,
}: {
  name?: string | null | undefined;
  url?: string | null | undefined;
  className?: string | undefined;
}) {
  const src = useAssetUrl(url);
  return src ? (
    <img
      src={src}
      alt={name ?? "Profile photo"}
      loading="lazy"
      className={cn("size-11 rounded-2xl object-cover", className)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-11 items-center justify-center rounded-2xl bg-accent text-sm font-bold text-accent-foreground",
        className,
      )}
    >
      {(name ?? "S").trim().charAt(0).toUpperCase() || "S"}
    </span>
  );
}
