import Stripe from "npm:stripe@18";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/http.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(request) });
  }
  if (request.method !== "POST") return json(request, { error: "Méthode refusée." }, 405);

  try {
    const authorization = request.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const appUrl = Deno.env.get("APP_URL") || "";
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } }
    });
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const userResult = await supabase.auth.getUser();
    const user = userResult.data.user;
    if (!user) return json(request, { error: "Connexion requise." }, 401);

    const subscriptionResult = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const customerId = subscriptionResult.data?.stripe_customer_id;
    if (subscriptionResult.error || !customerId) {
      return json(request, { error: "Aucun abonnement Stripe trouvé." }, 404);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: appUrl + "#settings"
    });
    return json(request, { url: session.url });
  } catch (error) {
    console.error(error);
    return json(request, { error: "Impossible d'ouvrir la gestion de l'abonnement." }, 500);
  }
});
