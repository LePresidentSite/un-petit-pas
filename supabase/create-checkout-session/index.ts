import Stripe from "npm:stripe@18";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/http.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(request) });
  }
  if (request.method !== "POST") return json(request, { error: "Méthode refusée." }, 405);

  let founderReservationId: string | null = null;
  let admin: any = null;

  try {
    const authorization = request.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const appUrl = Deno.env.get("APP_URL") || "";
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } }
    });
    admin = createClient(supabaseUrl, serviceRoleKey);
    const userResult = await supabase.auth.getUser();
    const user = userResult.data.user;
    if (!user || !user.email) return json(request, { error: "Connexion requise." }, 401);

    const payload = await request.json();
    const plan = ["monthly", "yearly", "lifetime"].includes(payload.plan)
      ? payload.plan
      : "monthly";
    if (!appUrl) throw new Error("URL publique manquante.");

    const subscriptionResult = await admin
      .from("subscriptions")
      .select("status,plan,stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (subscriptionResult.error) throw subscriptionResult.error;

    let customerId = subscriptionResult.data?.stripe_customer_id || undefined;
    let customerExistsInCurrentStripeAccount = false;
    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        customerExistsInCurrentStripeAccount = !customer.deleted;
      } catch (error) {
        if (!isMissingStripeResource(error)) throw error;
        customerId = undefined;
      }
    }

    if (!customerExistsInCurrentStripeAccount && subscriptionResult.data) {
      const resetResult = await admin
        .from("subscriptions")
        .update({
          stripe_customer_id: null,
          stripe_subscription_id: null,
          status: "inactive",
          plan: null,
          price_id: null,
          current_period_end: null,
          cancel_at_period_end: false
        })
        .eq("user_id", user.id);
      if (resetResult.error) throw resetResult.error;
    }

    if (
      customerExistsInCurrentStripeAccount &&
      ["active", "trialing"].includes(subscriptionResult.data?.status || "")
    ) {
      return json(request, { error: "Ton accès PRO est déjà actif." }, 409);
    }

    let priceId = "";
    let mode: Stripe.Checkout.SessionCreateParams.Mode = "subscription";
    let founderOffer = false;

    if (plan === "monthly") priceId = Deno.env.get("STRIPE_PRICE_MONTHLY") || "";
    if (plan === "yearly") priceId = Deno.env.get("STRIPE_PRICE_YEARLY") || "";

    if (plan === "lifetime") {
      mode = "payment";
      const reservationResult = await admin.rpc("reserve_founder_access", {
        target_user_id: user.id
      });
      if (reservationResult.error) throw reservationResult.error;
      founderReservationId = reservationResult.data?.[0]?.reservation_id || null;
      founderOffer = Boolean(founderReservationId);
      priceId = founderOffer
        ? Deno.env.get("STRIPE_PRICE_LIFETIME_FOUNDER") || ""
        : Deno.env.get("STRIPE_PRICE_LIFETIME") || "";
    }

    if (!priceId) throw new Error("Prix Stripe manquant.");

    const metadata = {
      user_id: user.id,
      plan,
      price_id: priceId,
      founder_offer: String(founderOffer),
      founder_reservation_id: founderReservationId || ""
    };
    const common: Stripe.Checkout.SessionCreateParams = {
      mode,
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: !founderOffer,
      locale: "fr",
      success_url: appUrl + "?payment=success#pro",
      cancel_url: appUrl + "?payment=cancelled#pro",
      metadata
    };

    if (mode === "subscription") {
      common.subscription_data = {
        metadata,
        ...(customerId ? {} : { trial_period_days: 45 })
      };
    } else {
      common.customer_creation = customerId ? undefined : "always";
      common.expires_at = Math.floor(Date.now() / 1000) + 30 * 60;
      common.payment_intent_data = { metadata };
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(common);
    } catch (error) {
      if (isMissingStripeResource(error)) {
        throw new Error(
          "La configuration Stripe Production est incomplète. Vérifie les identifiants de tarifs."
        );
      }
      throw error;
    }
    if (founderReservationId) {
      const updateResult = await admin
        .from("founder_reservations")
        .update({
          stripe_checkout_session_id: session.id,
          expires_at: new Date((session.expires_at || 0) * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", founderReservationId);
      if (updateResult.error) throw updateResult.error;
    }

    return json(request, { url: session.url });
  } catch (error) {
    console.error(error);
    if (founderReservationId && admin) {
      await admin
        .from("founder_reservations")
        .update({ status: "released", updated_at: new Date().toISOString() })
        .eq("id", founderReservationId)
        .eq("status", "reserved");
    }
    const message = error instanceof Error &&
        error.message.startsWith("La configuration Stripe Production")
      ? error.message
      : "Impossible de démarrer le paiement.";
    return json(request, { error: message }, 500);
  }
});

function isMissingStripeResource(error: unknown) {
  const stripeError = error as { code?: string };
  return stripeError?.code === "resource_missing";
}
