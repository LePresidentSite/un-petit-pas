import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/http.ts";

const FOUNDER_LIMIT = 100;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(request) });
  }
  if (request.method !== "GET") return json(request, { error: "Méthode refusée." }, 405);

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    await admin
      .from("founder_reservations")
      .update({ status: "released", updated_at: new Date().toISOString() })
      .eq("status", "reserved")
      .lte("expires_at", new Date().toISOString());

    const countResult = await admin
      .from("founder_reservations")
      .select("id", { count: "exact", head: true })
      .in("status", ["reserved", "paid"]);
    if (countResult.error) throw countResult.error;

    const used = Math.min(FOUNDER_LIMIT, countResult.count || 0);
    const remaining = Math.max(0, FOUNDER_LIMIT - used);
    return json(request, {
      founderActive: remaining > 0,
      founderRemaining: remaining,
      founderLimit: FOUNDER_LIMIT
    });
  } catch (error) {
    console.error(error);
    return json(request, { error: "Compteur indisponible." }, 500);
  }
});
