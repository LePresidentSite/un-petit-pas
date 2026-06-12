import Stripe from "npm:stripe@18";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (request) => {
  const signature = request.headers.get("Stripe-Signature");
  if (!signature) return new Response("Signature manquante.", { status: 400 });

  try {
    const body = await request.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || "",
      undefined,
      cryptoProvider
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment" && session.metadata?.plan === "lifetime") {
        await activateLifetimeAccess(session);
      } else if (session.subscription) {
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription, session.client_reference_id || session.metadata?.user_id || null);
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(event.data.object as Stripe.Subscription, null);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const reservationId = session.metadata?.founder_reservation_id;
      if (reservationId) await releaseFounderReservation(reservationId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(error);
    return new Response("Webhook invalide.", { status: 400 });
  }
});

async function syncSubscription(subscription: Stripe.Subscription, fallbackUserId: string | null) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
  let userId = subscription.metadata.user_id || fallbackUserId;

  if (!userId) {
    const existing = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = existing.data?.user_id || null;
  }
  if (!userId) throw new Error("Aucun utilisateur associé à l'abonnement Stripe.");

  const currentAccess = await admin
    .from("subscriptions")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle();
  if (currentAccess.data?.plan === "lifetime" && currentAccess.data?.status === "active") return;

  const item = subscription.items.data[0];
  const interval = item?.price.recurring?.interval;
  const currentPeriodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;
  const result = await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    plan: interval === "year" ? "yearly" : "monthly",
    price_id: item?.price.id || null,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end
  }, { onConflict: "user_id" });

  if (result.error) throw result.error;
}

async function activateLifetimeAccess(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.user_id;
  if (!userId || session.payment_status !== "paid") {
    throw new Error("Paiement à vie non confirmé.");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const customerId = typeof session.customer === "string"
    ? session.customer
    : session.customer?.id || null;
  const accessResult = await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: null,
    status: "active",
    plan: "lifetime",
    price_id: session.metadata?.price_id || null,
    current_period_end: null,
    cancel_at_period_end: false
  }, { onConflict: "user_id" });
  if (accessResult.error) throw accessResult.error;

  const reservationId = session.metadata?.founder_reservation_id;
  if (reservationId) {
    const reservationResult = await admin
      .from("founder_reservations")
      .update({
        status: "paid",
        stripe_checkout_session_id: session.id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", reservationId)
      .eq("user_id", userId);
    if (reservationResult.error) throw reservationResult.error;
  }
}

async function releaseFounderReservation(reservationId: string) {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );
  const result = await admin
    .from("founder_reservations")
    .update({ status: "released", updated_at: new Date().toISOString() })
    .eq("id", reservationId)
    .eq("status", "reserved");
  if (result.error) throw result.error;
}
