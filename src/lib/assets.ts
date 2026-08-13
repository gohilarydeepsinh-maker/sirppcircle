import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Assets are stored as "<bucket>/<path>" strings so they can be signed on demand.
 * External URLs (Google avatars, pasted links) are passed through untouched.
 */
export function isExternalUrl(value?: string | null) {
  return Boolean(value && /^(https?:|data:|blob:|\/)/i.test(value));
}

export function isStorageRef(value?: string | null) {
  return Boolean(value && !isExternalUrl(value) && value.includes("/"));
}

export async function signAsset(ref: string, expiresIn = 60 * 60): Promise<string | null> {
  const [bucket, ...rest] = ref.split("/");
  const path = rest.join("/");
  if (!bucket || !path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    console.error(error);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** Resolves a stored asset reference (storage ref or plain URL) to a usable src. */
export function useAssetUrl(value?: string | null) {
  const query = useQuery({
    queryKey: ["asset-url", value],
    enabled: isStorageRef(value),
    staleTime: 45 * 60 * 1000,
    queryFn: () => signAsset(value as string),
  });
  if (!value) return null;
  if (isExternalUrl(value)) return value;
  return query.data ?? null;
}

const EXT = /\.([a-z0-9]+)$/i;

function extensionOf(file: File) {
  const match = EXT.exec(file.name);
  return (match?.[1] ?? "png").toLowerCase();
}

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export function validateImage(file: File, maxMb = 4) {
  if (!IMAGE_TYPES.includes(file.type)) return "Please choose a PNG, JPG, WEBP or SVG image.";
  if (file.size > maxMb * 1024 * 1024) return `Image must be smaller than ${maxMb}MB.`;
  return null;
}

/** Owner-only college logo upload. Returns the storage ref to save in settings. */
export async function uploadBrandingImage(file: File, kind: "logo" | "favicon") {
  const path = `${kind}-${Date.now()}.${extensionOf(file)}`;
  const { error } = await supabase.storage
    .from("branding")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return `branding/${path}`;
}

/** Each member may only write inside their own folder (enforced by storage policies). */
export async function uploadAvatar(userId: string, file: File) {
  const path = `${userId}/avatar-${Date.now()}.${extensionOf(file)}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return `avatars/${path}`;
}
