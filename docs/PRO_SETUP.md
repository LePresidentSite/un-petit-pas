# Configuration Gratuit + PRO

L'application reste utilisable localement et hors ligne sans compte. Les comptes et paiements deviennent actifs lorsque Supabase et Stripe sont configurés.

## 1. Supabase

1. Créer un projet Supabase.
2. Exécuter `supabase/schema.sql` dans l'éditeur SQL.
3. Activer l'authentification par courriel et mot de passe.
4. Ajouter l'URL publique de l'application dans les URL de redirection Auth.
5. Déployer les trois Edge Functions du dossier `supabase/functions`.

## 2. Stripe

Créer un produit **Un Petit Pas PRO** avec deux prix récurrents :

- Mensuel : 4,99 $ CA
- Annuel : 29,99 $ CA

Créer aussi deux prix uniques pour l'accès à vie :

- Offre Fondateur : 39,99 $ CA
- Prix régulier : 99,00 $ CA

Configurer les secrets des Edge Functions :

```text
APP_URL=https://unpetitpas.net
APP_FALLBACK_URLS=https://www.unpetitpas.net,https://un-petit-pas.vercel.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
STRIPE_PRICE_LIFETIME_FOUNDER=price_...
STRIPE_PRICE_LIFETIME=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Les clés `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `SUPABASE_SERVICE_ROLE_KEY` ne doivent jamais être placées dans GitHub, `config.js` ou le navigateur.

Créer ensuite un webhook Stripe vers :

```text
https://VOTRE_PROJET.supabase.co/functions/v1/stripe-webhook
```

Événements requis :

- `checkout.session.completed`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

L'offre Fondateur réserve atomiquement au maximum 100 places. Une réservation de paiement expire après 30 minutes; une fois les 100 places payées ou temporairement réservées, le serveur utilise automatiquement le prix régulier de 99,00 $.

## 3. Configuration publique

Compléter `config.js` :

```js
window.UN_PETIT_PAS_CONFIG = Object.freeze({
  supabaseUrl: "https://VOTRE_PROJET.supabase.co",
  supabaseAnonKey: "VOTRE_CLE_PUBLIQUE",
  functionsBaseUrl: "https://VOTRE_PROJET.supabase.co/functions/v1"
});
```

La clé publique Supabase peut être utilisée dans le navigateur lorsque les règles RLS sont actives. La clé `service_role` reste uniquement dans les secrets Supabase.

## 4. Déploiement

GitHub Pages peut héberger la PWA, mais ne peut pas exécuter Stripe côté serveur. Les Edge Functions Supabase fournissent cette partie serveur.

Tester d'abord avec les clés et prix Stripe de test, puis remplacer uniquement les secrets Supabase par les valeurs de production.
