import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
export type NotifType = Database["public"]["Enums"]["notif_type"];
export type NotifAudience = Database["public"]["Enums"]["notif_audience"];
export type NotifStatus = Database["public"]["Enums"]["notif_status"];

export type NotificationRead = Database["public"]["Tables"]["notification_reads"]["Row"];

export const NOTIF_TYPES: { value: NotifType; label: string }[] = [
  { value: "announcement", label: "Announcement" },
  { value: "important", label: "Important" },
  { value: "update", label: "Update" },
  { value: "material", label: "Study material" },
  { value: "event", label: "Event" },
];

export const NOTIF_AUDIENCES: { value: NotifAudience; label: string }[] = [
  { value: "all_users", label: "All users" },
  { value: "all_students", label: "All students" },
  { value: "semester", label: "Selected semester" },
  { value: "subject", label: "Selected subject" },
];

const EXT = /\.([a-z0-9]+)$/i;

export const NOTIF_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function validateNotificationImage(file: File) {
  if (!NOTIF_IMAGE_TYPES.includes(file.type)) return "Please choose a PNG, JPG or WEBP image.";
  if (file.size > 5 * 1024 * 1024) return "Image must be smaller than 5MB.";
  return null;
}

/** Admin/owner upload of an announcement image (storage policies enforce staff-only). */
export async function uploadNotificationImage(file: File) {
  const ext = (EXT.exec(file.name)?.[1] ?? "png").toLowerCase();
  const path = `announcement-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("notifications")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return `notifications/${path}`;
}

/**
 * Notifications visible to the signed-in user. Row level security already limits
 * this to published, in-schedule rows targeted at the user (staff see everything),
 * so the client never decides access.
 */
export function useMyNotifications(userId?: string | null, isStaff = false) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ["notifications", "mine", userId, isStaff],
    staleTime: 30_000,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("status", "published")
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      query = query;
      const [{ data, error }, reads] = await Promise.all([
        query,
        supabase.from("notification_reads").select("*").eq("user_id", userId!),
      ]);
      if (error) throw error;
      if (reads.error) throw reads.error;
      const readMap = new Map((reads.data ?? []).map((r) => [r.notification_id, r]));
      return (data ?? []).map((n) => ({
        ...n,
        read: readMap.get(n.id) ?? null,
      }));
    },
  });
}

export type NotificationWithRead = Notification & { read: NotificationRead | null };

/** Every notification (draft + published) for admin/owner management. */
export function useAllNotifications(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ["notifications", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMarkNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      notificationId,
      userId,
      closed,
    }: {
      notificationId: string;
      userId: string;
      closed?: boolean;
    }) => {
      const payload = {
        notification_id: notificationId,
        user_id: userId,
        seen_at: new Date().toISOString(),
        ...(closed ? { closed_at: new Date().toISOString() } : {}),
      };
      const { error } = await supabase
        .from("notification_reads")
        .upsert(payload, { onConflict: "notification_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useSaveNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | null; values: NotificationInsert }) => {
      if (id) {
        const { error } = await supabase.from("notifications").update(values).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("notifications").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
