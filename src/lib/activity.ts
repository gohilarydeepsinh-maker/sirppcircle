import { supabase } from "@/integrations/supabase/client";

export async function logActivity(
  actorId: string | null | undefined,
  action: string,
  targetType?: string,
  targetId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  if (!actorId) return;
  const { error } = await supabase.from("activity_logs").insert({
    actor_id: actorId,
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    metadata: metadata as never,
  });
  if (error) console.warn("activity log failed", error.message);
}
