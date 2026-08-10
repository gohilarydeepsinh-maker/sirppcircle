import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  adminId: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type Result =
  | { ok: true; access_token: string; refresh_token: string }
  | { ok: false; error: string };

/**
 * Admin ID + password login. Credentials live only in server env vars and are
 * verified server-side; the browser never receives them. On success we mint a
 * real Supabase session for the dedicated admin auth account.
 */
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<Result> => {
    const expectedId = process.env["ADMIN_LOGIN_ID"];
    const expectedPassword = process.env["ADMIN_LOGIN_PASSWORD"];
    const adminEmail = process.env["ADMIN_AUTH_EMAIL"];
    const supabaseUrl = process.env["SUPABASE_URL"];
    const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];

    if (!expectedId || !expectedPassword || !adminEmail || !supabaseUrl || !publishableKey) {
      return { ok: false, error: "Admin login is not configured yet." };
    }

    const idOk = safeEqual(data.adminId, expectedId);
    const passwordOk = safeEqual(data.password, expectedPassword);
    if (!idOk || !passwordOk) {
      return { ok: false, error: "Invalid Admin ID or Password" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId: string | undefined;
    const created = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: expectedPassword,
      email_confirm: true,
      user_metadata: { full_name: "Administrator" },
    });
    userId = created.data.user?.id;

    if (!userId) {
      const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      userId = list.data.users.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase())?.id;
      if (userId) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: expectedPassword,
          email_confirm: true,
        });
      }
    }

    if (!userId) return { ok: false, error: "Unable to sign in. Please try again." };

    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        email: adminEmail,
        name: "Administrator",
        role: "admin",
        is_active: true,
      },
      { onConflict: "id" },
    );

    const { createClient } = await import("@supabase/supabase-js");
    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (
            publishableKey.startsWith("sb_") &&
            headers.get("Authorization") === `Bearer ${publishableKey}`
          ) {
            headers.delete("Authorization");
          }
          headers.set("apikey", publishableKey);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { data: signIn, error } = await authClient.auth.signInWithPassword({
      email: adminEmail,
      password: expectedPassword,
    });

    if (error || !signIn.session) {
      console.error("admin sign-in failed", error?.message);
      return { ok: false, error: "Unable to sign in. Please try again." };
    }

    return {
      ok: true,
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    };
  });
