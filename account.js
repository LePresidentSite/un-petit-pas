(function () {
  "use strict";

  const config = window.UN_PETIT_PAS_CONFIG || {};
  const FREE_LIMITS = Object.freeze({
    customRoutineTasks: 3,
    favorites: 3,
    historyDays: 7,
    activeReminders: 1,
    freeRadioCategories: 2
  });
  const PRO_FEATURES = new Set([
    "advancedStats",
    "allZones",
    "cloudBackup",
    "customReminderTimes",
    "fullHistory",
    "multipleReminders",
    "premiumAmbiance",
    "unlimitedFavorites",
    "unlimitedRoutines"
  ]);
  const state = {
    ready: false,
    cloudEnabled: false,
    user: null,
    subscription: null,
    pricing: {
      founderActive: true,
      founderRemaining: 100,
      founderLimit: 100
    }
  };
  let client = null;

  function getSnapshot() {
    return {
      ready: state.ready,
      cloudEnabled: state.cloudEnabled,
      user: state.user,
      subscription: state.subscription,
      isPro: isPro(),
      pricing: state.pricing,
      limits: FREE_LIMITS
    };
  }

  function emitChange() {
    window.dispatchEvent(new CustomEvent("unpetitpas:account-change", {
      detail: getSnapshot()
    }));
  }

  function isConfigured() {
    return Boolean(
      config.supabaseUrl &&
      config.supabaseAnonKey &&
      config.functionsBaseUrl &&
      window.supabase &&
      typeof window.supabase.createClient === "function"
    );
  }

  function isPro() {
    if (!state.subscription) return false;
    return state.subscription.status === "active" || state.subscription.status === "trialing";
  }

  function can(feature) {
    return !PRO_FEATURES.has(feature) || isPro();
  }

  async function init() {
    if (!isConfigured()) {
      state.ready = true;
      state.cloudEnabled = false;
      emitChange();
      return getSnapshot();
    }

    state.cloudEnabled = true;
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    const result = await client.auth.getSession();
    if (result.error) throw result.error;
    await applySession(result.data.session);
    await loadPricingStatus();

    client.auth.onAuthStateChange(function (_event, session) {
      window.setTimeout(function () {
        applySession(session).catch(function (error) {
          console.warn("Mise à jour du compte impossible :", error);
        });
      }, 0);
    });

    state.ready = true;
    emitChange();
    return getSnapshot();
  }

  async function applySession(session) {
    state.user = session && session.user ? session.user : null;
    state.subscription = null;
    if (state.user) await loadSubscription();
    emitChange();
  }

  async function loadSubscription() {
    if (!client || !state.user) return null;
    const result = await client
      .from("subscriptions")
      .select("status,plan,price_id,current_period_end,cancel_at_period_end,stripe_customer_id")
      .eq("user_id", state.user.id)
      .maybeSingle();

    if (result.error) {
      console.warn("Abonnement impossible à charger :", result.error.message);
      state.subscription = null;
      return null;
    }

    state.subscription = result.data || null;
    return state.subscription;
  }

  async function signUp(email, password, firstName) {
    requireCloud();
    validateCredentials(email, password);
    const result = await client.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: { first_name: (firstName || "").trim() },
        emailRedirectTo: getAppUrl("#settings")
      }
    });
    if (result.error) throw result.error;
    return result.data;
  }

  async function signIn(email, password) {
    requireCloud();
    validateCredentials(email, password);
    const result = await client.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });
    if (result.error) throw result.error;
    return result.data;
  }

  async function signOut() {
    requireCloud();
    const result = await client.auth.signOut();
    if (result.error) throw result.error;
  }

  async function resetPassword(email) {
    requireCloud();
    if (!email || !email.includes("@")) throw new Error("Entre une adresse courriel valide.");
    const result = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getAppUrl("#settings")
    });
    if (result.error) throw result.error;
  }

  async function startCheckout(plan) {
    requireCloud();
    requireUser();
    if (!["monthly", "yearly", "lifetime"].includes(plan)) throw new Error("Forfait invalide.");
    const data = await callFunction("create-checkout-session", { plan: plan });
    if (!data.url) throw new Error("Stripe n'a pas retourné de page de paiement.");
    window.location.assign(data.url);
  }

  async function openCustomerPortal() {
    requireCloud();
    requireUser();
    const data = await callFunction("create-portal-session", {});
    if (!data.url) throw new Error("Le portail d'abonnement est indisponible.");
    window.location.assign(data.url);
  }

  async function loadPricingStatus() {
    if (!state.cloudEnabled) return state.pricing;
    try {
      const response = await fetch(joinUrl(config.functionsBaseUrl, "pricing-status"));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tarifs indisponibles.");
      state.pricing = {
        founderActive: Boolean(data.founderActive),
        founderRemaining: Math.max(0, Number(data.founderRemaining) || 0),
        founderLimit: Math.max(1, Number(data.founderLimit) || 100)
      };
      emitChange();
    } catch (error) {
      console.warn("Compteur Fondateur indisponible :", error);
    }
    return state.pricing;
  }

  async function loadCloudBackup() {
    requireCloud();
    requireUser();
    const result = await client
      .from("user_backups")
      .select("payload,updated_at")
      .eq("user_id", state.user.id)
      .maybeSingle();
    if (result.error) throw result.error;
    return result.data || null;
  }

  async function saveCloudBackup(payload) {
    requireCloud();
    requireUser();
    const result = await client
      .from("user_backups")
      .upsert({
        user_id: state.user.id,
        payload: payload
      }, { onConflict: "user_id" })
      .select("updated_at")
      .single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function callFunction(name, body) {
    const sessionResult = await client.auth.getSession();
    const session = sessionResult.data.session;
    if (!session) throw new Error("Reconnecte-toi pour continuer.");

    const response = await fetch(joinUrl(config.functionsBaseUrl, name), {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + session.access_token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || "Le service est momentanément indisponible.");
    return data;
  }

  function requireCloud() {
    if (!state.cloudEnabled || !client) {
      throw new Error("Les comptes seront disponibles dès que Supabase sera configuré.");
    }
  }

  function requireUser() {
    if (!state.user) throw new Error("Crée un compte ou connecte-toi d'abord.");
  }

  function validateCredentials(email, password) {
    if (!email || !email.includes("@")) throw new Error("Entre une adresse courriel valide.");
    if (!password || password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  }

  function getAppUrl(hash) {
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
    const configuredUrl = String(config.appUrl || "").replace(/\/+$/, "");
    const currentUrl = window.location.origin + window.location.pathname.replace(/\/index\.html$/, "/");
    const baseUrl = isLocal || !configuredUrl ? currentUrl.replace(/\/+$/, "") : configuredUrl;
    return baseUrl + "/" + String(hash || "").replace(/^\/+/, "");
  }

  function joinUrl(base, path) {
    return String(base).replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
  }

  window.UnPetitPasAccount = {
    init: init,
    can: can,
    getSnapshot: getSnapshot,
    isPro: isPro,
    loadSubscription: loadSubscription,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    resetPassword: resetPassword,
    startCheckout: startCheckout,
    openCustomerPortal: openCustomerPortal,
    loadPricingStatus: loadPricingStatus,
    loadCloudBackup: loadCloudBackup,
    saveCloudBackup: saveCloudBackup,
    limits: FREE_LIMITS
  };
})();
