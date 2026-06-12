# Guide complet de configuration - Un Petit Pas

Ce guide explique comment relier l'application **Un Petit Pas** à Supabase, Stripe et Vercel, d'abord en mode Test, puis en production.

Il est écrit pour une personne non développeuse. Suivre les étapes dans l'ordre et ne jamais copier une clé secrète dans GitHub.

Dernière vérification des interfaces : 12 juin 2026.

---

## 0. Ce qu'il faut savoir avant de commencer

L'application est composée de trois services :

| Service | Rôle |
|---|---|
| Vercel | Héberge le site et la PWA |
| Supabase | Gère les comptes, la base de données et les fonctions serveur |
| Stripe | Gère les paiements et les abonnements |

Le chemin local du projet est :

```text
C:\Users\Utilisateur\OneDrive\Documents\New project\un-petit-pas
```

### État actuel à connaître

Les comptes et les paiements sont déjà programmés, mais ils restent désactivés tant que `config.js`, Supabase et Stripe ne sont pas configurés.

Trois améliorations de code devront être faites avant une ouverture publique définitive :

1. La récupération de mot de passe envoie le courriel, mais l'écran permettant de choisir le nouveau mot de passe n'est pas encore créé.
2. Après un paiement, l'application ne vérifie l'abonnement qu'une fois après 2,5 secondes. Il peut être nécessaire de rafraîchir la page si le webhook Stripe est plus lent.
3. Les paiements bancaires différés ne sont pas gérés. Pour la première mise en production, conserver uniquement les cartes et les portefeuilles fondés sur une carte.

Ces points n'empêchent pas de configurer et de tester l'inscription, la connexion et les paiements par carte.

---

## 1. Préparer les comptes nécessaires

Créer les comptes suivants si ce n'est pas déjà fait :

1. GitHub : <https://github.com/>
2. Supabase : <https://supabase.com/dashboard>
3. Stripe : <https://dashboard.stripe.com/>
4. Vercel : <https://vercel.com/>

Utiliser une adresse courriel professionnelle à laquelle vous avez toujours accès.

Activer l'authentification à deux facteurs dans Stripe, GitHub, Supabase et Vercel.

### Préparer un gestionnaire de mots de passe

Conserver les mots de passe et les clés secrètes dans un gestionnaire comme 1Password, Bitwarden ou Dashlane.

Ne jamais conserver une clé Stripe secrète dans :

- `config.js`
- un fichier publié dans GitHub
- une capture d'écran
- un courriel
- un document public

---

## 2. Fiche de valeurs à remplir

Remplir cette fiche au fur et à mesure. Les valeurs Test et Live ne doivent jamais être mélangées.

### Valeurs Supabase

```text
Nom du projet :
Project ref :
URL Supabase :
Clé publique anon :
URL des fonctions :
URL Vercel finale :
```

### Valeurs Stripe Test

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
STRIPE_PRICE_LIFETIME=price_...
STRIPE_PRICE_LIFETIME_FOUNDER=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Valeurs Stripe Live

```text
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
STRIPE_PRICE_LIFETIME=price_...
STRIPE_PRICE_LIFETIME_FOUNDER=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Un identifiant de prix commence par `price_`. Ne pas copier l'identifiant du produit qui commence par `prod_`.

---

# PARTIE A - SUPABASE

## 3. Créer le projet Supabase

1. Ouvrir <https://supabase.com/dashboard>.
2. Se connecter.
3. Cliquer sur **New project** ou **Nouveau projet**.
4. Si Supabase demande une organisation, créer ou sélectionner l'organisation de Caroline.
5. Dans **Project name**, écrire :

```text
Un Petit Pas
```

6. Dans **Database password**, créer un mot de passe long et unique.
7. Enregistrer ce mot de passe dans le gestionnaire de mots de passe.
8. Dans **Region**, choisir la région la plus proche des utilisateurs, idéalement une région nord-américaine proche du Canada.
9. Choisir le forfait Supabase désiré.
10. Cliquer sur **Create new project**.
11. Attendre que le projet soit indiqué comme prêt ou **Healthy**.

Le mot de passe de base de données ne doit pas être mis dans l'application.

### Trouver le Project ref

Le `Project ref` est l'identifiant unique du projet.

Méthode 1 :

1. Regarder l'adresse dans le navigateur.
2. Elle ressemble à :

```text
https://supabase.com/dashboard/project/abcdefghijklmnopqrst
```

3. La partie `abcdefghijklmnopqrst` est le `Project ref`.

Méthode 2 :

1. Ouvrir le projet Supabase.
2. Ouvrir **Project Settings** ou **Settings**.
3. Ouvrir **General**.
4. Repérer **Reference ID** ou **Project ID**.

Noter cette valeur dans la fiche.

---

## 4. Exécuter `schema.sql`

Cette opération crée les tables nécessaires aux abonnements et à l'offre Fondateur.

### Copier le fichier SQL

1. Sur l'ordinateur, ouvrir le dossier :

```text
C:\Users\Utilisateur\OneDrive\Documents\New project\un-petit-pas\supabase
```

2. Ouvrir le fichier `schema.sql` avec Visual Studio Code ou le Bloc-notes.
3. Appuyer sur `Ctrl+A` pour tout sélectionner.
4. Appuyer sur `Ctrl+C` pour copier.

### Exécuter le SQL dans Supabase

1. Revenir dans le projet Supabase.
2. Dans le menu gauche, cliquer sur **SQL Editor**.
3. Cliquer sur **New query**.
4. Effacer le contenu d'exemple s'il y en a.
5. Cliquer dans la grande zone de texte.
6. Appuyer sur `Ctrl+V`.
7. Vérifier que le texte commence par :

```sql
create table if not exists public.subscriptions
```

8. Cliquer sur **Run**.
9. Attendre le message de réussite.

Le résultat normal est un message comme **Success. No rows returned**. Ce n'est pas une erreur : le script crée des éléments, mais ne retourne pas de liste.

### Vérifier les tables

1. Ouvrir **Table Editor** dans le menu gauche.
2. Vérifier que ces deux tables apparaissent dans le schéma `public` :

```text
subscriptions
founder_reservations
```

3. Ouvrir `subscriptions`.
4. Vérifier que des colonnes comme `user_id`, `status`, `plan` et `stripe_customer_id` sont visibles.
5. Ouvrir `founder_reservations`.
6. Vérifier que des colonnes comme `user_id`, `status`, `expires_at` et `paid_at` sont visibles.

Les tables sont vides à cette étape, ce qui est normal.

### Vérification SQL facultative

Dans **SQL Editor**, créer une nouvelle requête et exécuter :

```sql
select
  to_regclass('public.subscriptions') as subscriptions,
  to_regclass('public.founder_reservations') as founder_reservations,
  to_regprocedure('public.reserve_founder_access(uuid)') as founder_function;
```

Les trois colonnes doivent retourner un nom et non `null`.

---

## 5. Configurer l'authentification Supabase

### Activer les comptes par courriel

1. Dans Supabase, ouvrir **Authentication**.
2. Ouvrir **Providers** ou **Sign In / Providers**.
3. Cliquer sur **Email**.
4. Vérifier que le fournisseur Email est activé.
5. Activer **Confirm email** pour demander aux utilisateurs de confirmer leur adresse.
6. Enregistrer.

Pour un premier test très rapide, la confirmation peut être désactivée temporairement. Elle doit être réactivée avant la production.

### Configurer l'URL du site

Cette étape sera terminée après le premier déploiement Vercel, car Vercel donnera l'adresse finale du site.

Lorsque l'URL Vercel est connue :

1. Dans **Authentication**, ouvrir **URL Configuration**.
2. Dans **Site URL**, coller l'URL de production avec `https://`.

Exemple :

```text
https://un-petit-pas.vercel.app/
```

3. Dans **Redirect URLs**, ajouter exactement la même URL.
4. Enregistrer.

Ne pas utiliser une URL de prévisualisation Vercel changeante pour la production.

### Configurer les courriels

Pendant les premiers tests, Supabase peut envoyer des courriels avec son service intégré. Ce service est limité et ne convient pas à une application publique.

Avant la production :

1. Créer un compte chez un fournisseur SMTP, par exemple Resend, Brevo, Postmark, SendGrid ou AWS SES.
2. Vérifier le domaine d'envoi chez ce fournisseur.
3. Dans Supabase, ouvrir **Authentication**.
4. Ouvrir **Settings**, puis **Custom SMTP**.
5. Activer **Enable custom SMTP**.
6. Coller les valeurs données par le fournisseur :

| Champ Supabase | Valeur à obtenir du fournisseur |
|---|---|
| Sender email | Adresse d'expédition, par exemple `bonjour@votredomaine.ca` |
| Sender name | `Un Petit Pas` |
| Host | Serveur SMTP |
| Port | Généralement `465` ou `587` |
| Username | Nom d'utilisateur SMTP |
| Password | Mot de passe ou clé SMTP |

7. Enregistrer.
8. Envoyer ensuite un courriel de confirmation de test.

Ne pas utiliser le mot de passe personnel d'une boîte Gmail.

---

## 6. Trouver les clés publiques Supabase

### Trouver l'URL Supabase

1. Dans le projet Supabase, ouvrir **Integrations**.
2. Ouvrir **Data API**.
3. Copier **Project URL**.

La valeur ressemble à :

```text
https://abcdefghijklmnopqrst.supabase.co
```

Noter cette valeur comme `URL Supabase`.

### Trouver la clé `anon`

Le code actuel utilise la clé publique historique `anon`.

1. Dans Supabase, ouvrir **Settings**.
2. Ouvrir **API Keys**.
3. Ouvrir l'onglet **Legacy API Keys**.
4. Repérer la clé nommée `anon` avec le rôle `anon public`.
5. Cliquer sur **Copy**.
6. Noter cette valeur comme `Clé publique anon`.

Cette clé peut apparaître dans le navigateur parce que les règles RLS sont activées.

Ne jamais copier la clé `service_role` dans `config.js`.

Si l'onglet **Legacy API Keys** n'existe pas dans un nouveau projet, arrêter cette étape. Le code devra d'abord être adapté au nouveau système de clés Supabase avant le déploiement.

### Construire l'URL des fonctions

Prendre l'URL Supabase et ajouter `/functions/v1`.

Exemple :

```text
https://abcdefghijklmnopqrst.supabase.co/functions/v1
```

Noter cette valeur comme `URL des fonctions`.

---

## 7. Remplir `config.js`

Ouvrir :

```text
C:\Users\Utilisateur\OneDrive\Documents\New project\un-petit-pas\config.js
```

Remplacer seulement les trois valeurs vides :

```javascript
window.UN_PETIT_PAS_CONFIG = Object.freeze({
  supabaseUrl: "https://VOTRE_PROJECT_REF.supabase.co",
  supabaseAnonKey: "VOTRE_CLE_ANON_PUBLIQUE",
  functionsBaseUrl: "https://VOTRE_PROJECT_REF.supabase.co/functions/v1"
});
```

Ne pas ajouter :

- la clé Stripe `sk_test_` ou `sk_live_`
- le secret Stripe `whsec_`
- la clé Supabase `service_role`

### Forcer la mise à jour de la PWA

Le service worker conserve `config.js` en cache.

1. Ouvrir `sw.js`.
2. Repérer :

```javascript
const CACHE_VERSION = "un-petit-pas-v26";
```

3. Augmenter le numéro, par exemple :

```javascript
const CACHE_VERSION = "un-petit-pas-v27";
```

4. Enregistrer.

À chaque modification importante de fichiers déjà mis en cache, augmenter ce numéro.

---

# PARTIE B - VERCEL

## 8. Mettre les fichiers dans GitHub

Le dossier `un-petit-pas` complet doit être dans GitHub, notamment :

- `index.html`
- `styles.css`
- les fichiers JavaScript
- `config.js`
- `manifest.webmanifest`
- `sw.js`
- `assets`
- `icons`
- `supabase`
- `docs`
- `.gitignore`

Les valeurs publiques Supabase présentes dans `config.js` peuvent être publiées.

Ne jamais mettre dans GitHub :

- `sk_test_...`
- `sk_live_...`
- `whsec_...`
- la clé Supabase `service_role`
- un fichier `.env`
- le dossier `.supabase`
- `node_modules`

Après avoir modifié `config.js` et `sw.js`, envoyer ces changements dans le dépôt GitHub.

---

## 9. Déployer le site sur Vercel

### Relier Vercel à GitHub

1. Ouvrir <https://vercel.com/>.
2. Se connecter avec GitHub.
3. Autoriser Vercel à accéder au dépôt `un-petit-pas`.
4. Dans Vercel, cliquer sur **Add New**, puis **Project**, ou directement **New Project**.
5. Repérer le dépôt GitHub `un-petit-pas`.
6. Cliquer sur **Import**.

### Configurer le projet

Sur l'écran **Configure Project** :

1. Dans **Project Name**, utiliser par exemple :

```text
un-petit-pas
```

2. Dans **Framework Preset**, choisir :

```text
Other
```

3. Configurer **Root Directory** :

- Si `index.html` se trouve directement à la racine du dépôt, laisser `./`.
- Si GitHub contient un dossier parent et que `index.html` est dans `un-petit-pas`, sélectionner le dossier `un-petit-pas`.

4. Développer **Build and Output Settings**.
5. Laisser **Build Command** vide.
6. Laisser **Install Command** vide.
7. Pour **Output Directory**, utiliser `.` si Vercel demande une valeur.
8. Ne créer aucune variable d'environnement Vercel pour le moment.
9. Cliquer sur **Deploy**.

Le projet est un site HTML/CSS/JavaScript statique. Il n'a pas besoin d'une commande de compilation.

### Vérifier le déploiement

Après quelques instants, Vercel affiche une adresse semblable à :

```text
https://un-petit-pas.vercel.app
```

1. Cliquer sur **Visit**.
2. Vérifier que la page d'accueil apparaît.
3. Ouvrir plusieurs sections.
4. Vérifier que les images, le logo et les styles apparaissent.
5. Noter cette URL comme `URL Vercel finale`.

### Revenir dans Supabase

Maintenant que l'URL est connue :

1. Supabase > **Authentication** > **URL Configuration**.
2. Coller l'URL Vercel dans **Site URL**.
3. Ajouter la même URL dans **Redirect URLs**.
4. Enregistrer.

### Domaine personnalisé facultatif

Si un domaine comme `app.unpetitpas.ca` est utilisé :

1. Vercel > projet > **Settings** > **Domains**.
2. Cliquer sur **Add Domain**.
3. Écrire le domaine.
4. Suivre exactement les instructions DNS affichées par Vercel.
5. Attendre que Vercel indique que le domaine est valide et que HTTPS est actif.
6. Remplacer ensuite l'ancienne URL Vercel dans :
   - Supabase Auth > Site URL
   - Supabase Auth > Redirect URLs
   - le secret Supabase `APP_URL`

Le domaine inscrit dans `APP_URL` doit être le domaine réellement utilisé par les clients.

---

# PARTIE C - STRIPE EN MODE TEST

## 10. Préparer Stripe

1. Ouvrir <https://dashboard.stripe.com/>.
2. Créer un compte ou se connecter.
3. Ouvrir un **Sandbox** ou activer le mode Test.
4. Vérifier visuellement que le tableau de bord indique **Test mode**, **Sandbox** ou **Données de test**.

Ne pas créer les premiers prix en mode Live.

---

## 11. Créer le produit et les quatre prix Test

### Créer le produit

1. Dans Stripe, ouvrir **Product catalog** ou **Catalogue de produits**.
2. Ouvrir **Products**.
3. Cliquer sur **Add product**.
4. Dans **Name**, écrire :

```text
Un Petit Pas PRO
```

5. Dans la description, écrire par exemple :

```text
Accès aux fonctionnalités PRO de l'application Un Petit Pas.
```

6. Ajouter le logo si désiré.

### Prix mensuel

Créer le premier prix avec :

```text
Pricing model : Standard pricing / Flat rate
Price : 4.99
Currency : CAD
Type : Recurring
Billing period : Monthly
```

Enregistrer le produit.

### Ajouter le prix annuel

1. Ouvrir le produit `Un Petit Pas PRO`.
2. Dans la section **Pricing**, cliquer sur **Add another price**.
3. Utiliser :

```text
Price : 29.99
Currency : CAD
Type : Recurring
Billing period : Yearly
```

4. Enregistrer.

La période d'essai de 45 jours n'est pas ajoutée au tarif dans ce formulaire Stripe. Elle est appliquée par la fonction `create-checkout-session` lors du premier abonnement mensuel ou annuel. Les accès à vie et Fondateur n'ont aucune période d'essai.

### Ajouter le prix à vie régulier

Ajouter un autre prix :

```text
Price : 99.00
Currency : CAD
Type : One time
```

### Ajouter le prix Fondateur

Ajouter un autre prix :

```text
Price : 39.99
Currency : CAD
Type : One time
```

Si Stripe propose une description interne, utiliser des noms clairs :

```text
Mensuel
Annuel
À vie régulier
À vie Fondateur
```

### Copier les quatre identifiants `price_`

Pour chaque prix :

1. Cliquer sur la ligne du prix.
2. Repérer **Price ID** ou **API ID**.
3. Copier la valeur qui commence par `price_`.
4. Coller chaque valeur dans la fiche Stripe Test.

Vérifier attentivement :

| Prix | Variable |
|---|---|
| 4,99 $ mensuel | `STRIPE_PRICE_MONTHLY` |
| 29,99 $ annuel | `STRIPE_PRICE_YEARLY` |
| 99,00 $ à vie | `STRIPE_PRICE_LIFETIME` |
| 39,99 $ Fondateur | `STRIPE_PRICE_LIFETIME_FOUNDER` |

---

## 12. Trouver la clé secrète Stripe Test

1. Vérifier que Stripe est toujours en mode Test ou dans le bon Sandbox.
2. Ouvrir **Developers** ou **Workbench**.
3. Ouvrir **API keys**.
4. Repérer **Secret key**.
5. Cliquer sur **Reveal test key** ou **Reveal**.
6. Copier la clé qui commence par :

```text
sk_test_
```

7. La noter comme `STRIPE_SECRET_KEY` dans la fiche Test.

Le projet n'utilise pas la clé Stripe publiable `pk_test_`.

Ne jamais mettre `sk_test_` dans GitHub, Vercel ou `config.js`.

---

## 13. Limiter les moyens de paiement pour la première version

Le webhook actuel suppose que le paiement à vie est confirmé immédiatement.

1. Dans Stripe, ouvrir **Settings**.
2. Ouvrir **Payment methods**.
3. Sélectionner la configuration utilisée par Checkout.
4. Conserver les cartes.
5. Apple Pay, Google Pay et Link peuvent rester actifs lorsqu'ils utilisent une carte.
6. Désactiver temporairement les prélèvements bancaires et autres moyens de paiement différés.

Ils pourront être ajoutés après la prise en charge des événements :

```text
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
```

---

## 14. Configurer le portail client Stripe Test

Le portail permet à l'utilisateur de gérer sa carte et d'annuler son abonnement.

1. Dans Stripe Test, ouvrir **Settings**.
2. Ouvrir **Billing**.
3. Ouvrir **Customer portal**.
4. Cliquer sur **Activate** ou **Save changes** si nécessaire.
5. Activer :
   - mise à jour du moyen de paiement;
   - consultation de l'historique des factures;
   - annulation de l'abonnement.
6. Pour l'annulation, choisir de préférence **At the end of the billing period**.
7. Pour le premier lancement, ne pas activer les changements complexes de produits.
8. Configurer le nom commercial, les couleurs et les liens légaux.
9. Enregistrer.

La configuration Test du portail est séparée de la configuration Live.

---

# PARTIE D - SECRETS ET EDGE FUNCTIONS

## 15. Ajouter les secrets Stripe dans Supabase

1. Revenir dans Supabase.
2. Ouvrir le projet `Un Petit Pas`.
3. Ouvrir **Edge Functions**.
4. Ouvrir **Secrets** ou cliquer sur **Manage secrets**.
5. Ajouter les secrets suivants un à un.

### Secret `APP_URL`

Nom :

```text
APP_URL
```

Valeur :

```text
https://un-petit-pas.vercel.app/
```

Remplacer par la véritable URL Vercel. Garder `https://` et ajouter `/` à la fin.

### Secrets Stripe Test

```text
STRIPE_SECRET_KEY
STRIPE_PRICE_MONTHLY
STRIPE_PRICE_YEARLY
STRIPE_PRICE_LIFETIME
STRIPE_PRICE_LIFETIME_FOUNDER
```

Pour chaque nom, coller la valeur Test correspondante.

Ne pas inventer les secrets Supabase suivants et ne pas les ajouter manuellement :

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Supabase les fournit automatiquement aux Edge Functions.

Le secret `STRIPE_WEBHOOK_SECRET` sera ajouté après la création du webhook.

---

## 16. Installer l'outil Supabase sur Windows

Les Edge Functions doivent être envoyées depuis le dossier du projet. La méthode ci-dessous utilise PowerShell et ne nécessite pas Docker.

### Installer Node.js

1. Ouvrir <https://nodejs.org/>.
2. Télécharger la version LTS.
3. Installer Node.js avec les options proposées par défaut.
4. Fermer puis rouvrir PowerShell.

### Vérifier Node.js

Dans PowerShell, exécuter :

```powershell
node --version
```

Le numéro doit être `v20` ou plus récent.

Ne pas installer Supabase avec `npm install -g supabase`. L'installation globale par npm n'est pas prise en charge.

---

## 17. Déployer les quatre Edge Functions

### Ouvrir PowerShell dans le bon dossier

1. Ouvrir l'Explorateur de fichiers.
2. Aller dans :

```text
C:\Users\Utilisateur\OneDrive\Documents\New project\un-petit-pas
```

3. Cliquer dans la barre d'adresse.
4. Écrire `powershell`.
5. Appuyer sur Entrée.

Une fenêtre PowerShell s'ouvre directement dans le projet.

### Vérifier l'outil Supabase

Exécuter :

```powershell
npx supabase --version
```

Lors du premier lancement, répondre `y` si PowerShell demande l'autorisation de télécharger le paquet.

### Se connecter à Supabase

Exécuter :

```powershell
npx supabase login
```

Suivre la page de connexion ouverte dans le navigateur. Si un jeton d'accès est demandé, le créer depuis les paramètres du compte Supabase et le coller uniquement dans PowerShell.

### Relier le dossier au projet Supabase

Remplacer `VOTRE_PROJECT_REF` par l'identifiant noté plus tôt :

```powershell
npx supabase link --project-ref VOTRE_PROJECT_REF
```

Si Supabase demande le mot de passe de base de données, utiliser celui créé à l'étape 3.

### Déployer les fonctions privées

Exécuter :

```powershell
npx supabase functions deploy create-checkout-session --use-api
```

Puis :

```powershell
npx supabase functions deploy create-portal-session --use-api
```

Ces deux fonctions doivent vérifier le jeton de connexion de l'utilisateur.

### Déployer les fonctions publiques

Exécuter :

```powershell
npx supabase functions deploy pricing-status --no-verify-jwt --use-api
```

Puis :

```powershell
npx supabase functions deploy stripe-webhook --no-verify-jwt --use-api
```

`pricing-status` est public afin d'afficher le nombre de places Fondateur. `stripe-webhook` doit accepter les appels de Stripe, qui ne possèdent pas de session utilisateur Supabase.

### Vérifier le déploiement

Exécuter :

```powershell
npx supabase functions list
```

Les quatre noms suivants doivent apparaître :

```text
create-checkout-session
create-portal-session
pricing-status
stripe-webhook
```

Ils doivent également apparaître dans Supabase > **Edge Functions**.

---

## 18. Tester la fonction publique de tarification

Ouvrir dans le navigateur :

```text
https://VOTRE_PROJECT_REF.supabase.co/functions/v1/pricing-status
```

Le résultat attendu ressemble à :

```json
{
  "founderActive": true,
  "founderRemaining": 100,
  "founderLimit": 100
}
```

Si une erreur apparaît :

1. Supabase > **Edge Functions** > `pricing-status`.
2. Ouvrir **Logs**.
3. Vérifier que `schema.sql` a bien créé `founder_reservations`.

---

# PARTIE E - WEBHOOK STRIPE

## 19. Créer le webhook Stripe Test

### Construire l'adresse du webhook

```text
https://VOTRE_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

### Créer la destination

1. Revenir dans le bon Sandbox Stripe.
2. Ouvrir **Workbench**.
3. Ouvrir l'onglet **Webhooks**.
4. Cliquer sur **Create event destination**, **Create new destination** ou **Add destination**.
5. Dans **Events from**, choisir **Your account** ou **Events on your account**.
6. Ne pas choisir **Connected accounts**.
7. Utiliser les événements **Snapshot**.
8. Dans les options avancées, ne pas activer **Use thin events**.
9. Sélectionner seulement les événements suivants :

```text
checkout.session.completed
checkout.session.expired
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

10. Cliquer sur **Continue**.
11. Choisir **Webhook endpoint** ou **Webhook** comme destination.
12. Dans **Endpoint URL**, coller l'adresse du webhook Supabase.
13. Dans le nom ou la description, écrire :

```text
Un Petit Pas - Supabase Test
```

14. Cliquer sur **Create destination**.

Le code actuel attend des événements Snapshot complets. Les événements Thin ne sont pas compatibles avec ce webhook.

### Copier le secret de signature

1. Ouvrir la destination nouvellement créée.
2. Repérer **Signing secret**.
3. Cliquer sur **Reveal**.
4. Copier la valeur qui commence par :

```text
whsec_
```

Ce secret est propre à cette destination Test.

### Coller le secret dans Supabase

1. Supabase > **Edge Functions** > **Secrets**.
2. Ajouter :

```text
STRIPE_WEBHOOK_SECRET
```

3. Coller le `whsec_` Test.
4. Enregistrer.

Il n'est normalement pas nécessaire de redéployer les fonctions après une modification de secret Supabase.

---

# PARTIE F - TESTS COMPLETS

## 20. Tester l'inscription

### Éviter l'ancien cache

Pour le premier test :

1. Ouvrir une fenêtre privée ou Incognito.
2. Aller sur l'URL Vercel.
3. Actualiser la page avec `Ctrl+F5`.

### Créer un compte

1. Dans l'application, ouvrir **Réglages**.
2. Ouvrir la zone de compte.
3. Cliquer sur **Créer un compte**.
4. Entrer un prénom.
5. Entrer une adresse courriel à laquelle vous avez accès.
6. Créer un mot de passe d'au moins 8 caractères.
7. Valider.

Si la confirmation de courriel est active :

1. Ouvrir la boîte de réception.
2. Vérifier aussi les pourriels.
3. Ouvrir le message Supabase.
4. Cliquer sur le lien de confirmation.
5. Vérifier que l'application se rouvre.
6. Revenir dans Réglages et se connecter.

### Vérifier le compte dans Supabase

1. Supabase > **Authentication** > **Users**.
2. Vérifier que l'adresse apparaît.
3. Vérifier que la colonne de confirmation indique que l'adresse est confirmée.

Il est normal qu'aucune ligne n'apparaisse encore dans `subscriptions`. Cette ligne sera créée après un paiement.

### Si le bouton de création de compte est désactivé

Vérifier :

1. Les trois valeurs de `config.js`.
2. Que les guillemets et virgules sont présents.
3. Que `sw.js` utilise une nouvelle version de cache.
4. Que les nouveaux fichiers ont été envoyés dans GitHub.
5. Que Vercel a redéployé le dernier changement.

---

## 21. Tester le mot de passe oublié

1. Ouvrir la fenêtre de connexion.
2. Saisir l'adresse du compte.
3. Cliquer sur **Mot de passe oublié**.
4. Vérifier que le courriel est reçu.

Limite actuelle : après avoir cliqué sur le lien, l'application ne propose pas encore le formulaire permettant de choisir un nouveau mot de passe. Ne pas considérer cette fonction comme terminée avant la correction du code.

---

## 22. Tester l'abonnement mensuel

1. Utiliser un compte confirmé et connecté.
2. Ouvrir la page PRO ou Tarifs.
3. Choisir **4,99 $ / mois**.
4. Vérifier que la page Stripe Checkout s'ouvre.
5. Utiliser cette carte Test :

```text
Numéro : 4242 4242 4242 4242
Expiration : n'importe quelle date future, par exemple 12/34
CVC : n'importe quels 3 chiffres, par exemple 123
Code postal : un code postal valide
```

6. Terminer le paiement.
7. Vérifier le retour dans l'application.
8. Attendre quelques secondes.
9. Si PRO ne s'active pas, actualiser une fois la page.

### Vérifier dans Stripe

1. Stripe Test > **Customers** : vérifier qu'un client a été créé.
2. Ouvrir le client.
3. Vérifier qu'un abonnement mensuel en période d'essai apparaît.
4. Vérifier que Stripe annonce le premier prélèvement après 45 jours.
5. Workbench > **Webhooks** > destination : vérifier que les livraisons ont le statut `200`.

### Vérifier dans Supabase

1. Supabase > **Table Editor** > `subscriptions`.
2. Vérifier qu'une ligne existe.
3. Vérifier :

```text
status = trialing
plan = monthly
stripe_customer_id = cus_...
stripe_subscription_id = sub_...
```

Le statut devient normalement `active` lorsque Stripe prélève le premier paiement après les 45 jours d'essai.

---

## 23. Tester l'abonnement annuel

Le code empêche un utilisateur déjà PRO d'acheter un deuxième forfait.

Utiliser une deuxième adresse de test :

1. Créer et confirmer un nouveau compte.
2. Choisir **29,99 $ / année**.
3. Utiliser la carte `4242 4242 4242 4242`.
4. Vérifier dans Supabase :

```text
status = trialing
plan = yearly
```

5. Vérifier que Stripe indique une facturation annuelle.

---

## 24. Tester l'offre Fondateur à vie

Utiliser un troisième compte :

1. Ouvrir la page PRO.
2. Vérifier que le compteur indique 100 places, ou une place de moins après les tests précédents à vie.
3. Choisir l'accès à vie.
4. Vérifier que Stripe affiche **39,99 $ CA**, et non 99 $.
5. Payer avec la carte Test.

Dans Supabase > `subscriptions`, vérifier :

```text
status = active
plan = lifetime
stripe_subscription_id = vide
```

Dans `founder_reservations`, vérifier :

```text
status = paid
paid_at = une date
```

Le compteur doit diminuer d'une place.

Une session à vie abandonnée peut réserver temporairement une place pendant environ 30 minutes.

---

## 25. Tester l'annulation et le portail client

Avec un compte mensuel ou annuel :

1. Se connecter.
2. Ouvrir Réglages.
3. Cliquer sur le bouton de gestion de l'abonnement.
4. Vérifier que le portail Stripe s'ouvre.
5. Tester la mise à jour du moyen de paiement.
6. Tester l'annulation à la fin de la période.
7. Revenir dans l'application.

Dans Supabase, après réception du webhook, vérifier :

```text
cancel_at_period_end = true
```

Le statut peut rester `active` jusqu'à la fin de la période, ce qui est normal.

---

## 26. Tester un paiement refusé

Utiliser un nouveau compte gratuit, puis la carte :

```text
4000 0000 0000 0002
```

Utiliser une date future et un CVC quelconque.

Résultat attendu :

- Stripe refuse le paiement;
- aucune ligne PRO active n'est créée;
- l'utilisateur reste Gratuit.

Ne jamais utiliser une vraie carte dans le mode Test Stripe.

---

## 27. Matrice minimale de tests

Avant le mode Live, toutes les lignes suivantes doivent être validées :

| Test | Résultat attendu |
|---|---|
| Création de compte | Utilisateur visible dans Supabase Auth |
| Confirmation du courriel | Connexion autorisée |
| Connexion et déconnexion | Session conservée correctement |
| Mensuel | `plan=monthly`, `status=active` |
| Annuel | `plan=yearly`, `status=active` |
| Fondateur | `plan=lifetime`, réservation `paid` |
| Paiement refusé | Aucun accès PRO |
| Annulation | Mise à jour reçue par webhook |
| Portail client | Ouverture et retour vers l'application |
| Compteur Fondateur | Baisse après un achat payé |
| Webhooks | Toutes les livraisons importantes retournent `200` |

---

# PARTIE G - PASSER EN MODE LIVE

## 28. Activer complètement le compte Stripe

Avant de recevoir de l'argent réel :

1. Dans Stripe, ouvrir les paramètres du compte.
2. Cliquer sur **Activate payments**, **Complete account setup** ou l'équivalent.
3. Fournir les informations légales demandées :
   - type d'entreprise;
   - nom légal;
   - adresse;
   - informations fiscales;
   - identité de la personne responsable;
   - compte bancaire pour les versements;
   - description apparaissant sur le relevé bancaire.
4. Activer l'authentification à deux facteurs.
5. Attendre que Stripe indique que les paiements Live sont activés.

Vérifier les obligations fiscales, la politique de remboursement, les conditions d'utilisation et la politique de confidentialité avant les ventes réelles.

---

## 29. Recréer les quatre prix en mode Live

Les produits et prix Test ne deviennent pas automatiquement des produits Live.

1. Quitter le Sandbox ou passer Stripe en mode Live.
2. Vérifier que l'indicateur Test/Sandbox n'est plus actif.
3. Ouvrir **Product catalog** > **Products**.
4. Créer le produit `Un Petit Pas PRO`.
5. Créer à nouveau :

```text
4,99 $ CA mensuel, récurrent chaque mois
29,99 $ CA annuel, récurrent chaque année
99,00 $ CA à vie, paiement unique
39,99 $ CA Fondateur, paiement unique
```

6. Copier les quatre nouveaux identifiants `price_`.
7. Les inscrire uniquement dans la fiche Live.

Ne pas réutiliser les identifiants `price_` du mode Test.

---

## 30. Configurer le portail client Live

1. Rester en mode Live.
2. Ouvrir **Settings** > **Billing** > **Customer portal**.
3. Activer la mise à jour des moyens de paiement.
4. Activer l'historique des factures.
5. Activer l'annulation à la fin de la période.
6. Ajouter les liens légaux et les informations commerciales.
7. Enregistrer.

La configuration Test n'est pas automatiquement copiée dans Live.

---

## 31. Trouver la clé Stripe Live

1. Stripe doit être en mode Live.
2. Ouvrir **Developers** ou **Workbench** > **API keys**.
3. Révéler **Secret key**.
4. Copier la valeur :

```text
sk_live_...
```

5. La conserver dans la fiche Live et le gestionnaire de mots de passe.

Ne jamais envoyer cette clé à quelqu'un par courriel ou la publier dans GitHub.

---

## 32. Créer le webhook Live

Le webhook Test ne reçoit pas les événements Live.

1. Rester en mode Live.
2. Workbench > **Webhooks**.
3. Créer une nouvelle destination.
4. Choisir **Your account**.
5. Choisir les événements Snapshot, sans activer Thin events.
6. Ajouter :

```text
checkout.session.completed
checkout.session.expired
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

7. Utiliser la même URL Supabase :

```text
https://VOTRE_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

8. Nommer la destination :

```text
Un Petit Pas - Supabase Live
```

9. Créer la destination.
10. Révéler son nouveau `whsec_`.
11. Inscrire ce secret dans la fiche Live.

Le `whsec_` Live est différent du `whsec_` Test.

---

## 33. Remplacer les secrets Test par les secrets Live

Dans Supabase > **Edge Functions** > **Secrets**, remplacer :

```text
STRIPE_SECRET_KEY
STRIPE_PRICE_MONTHLY
STRIPE_PRICE_YEARLY
STRIPE_PRICE_LIFETIME
STRIPE_PRICE_LIFETIME_FOUNDER
STRIPE_WEBHOOK_SECRET
```

Utiliser uniquement les six valeurs Live correspondantes.

Ne pas modifier :

```text
APP_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Les secrets Supabase deviennent disponibles sans redéploiement dans la plupart des cas.

### Contrôle anti-erreur

Avant d'ouvrir les ventes :

- `STRIPE_SECRET_KEY` commence par `sk_live_`;
- les quatre prix viennent du catalogue Live;
- `STRIPE_WEBHOOK_SECRET` vient de la destination Live;
- le portail client Live est activé;
- le webhook Live est activé.

Ne jamais mélanger une clé `sk_live_` avec des prix Test.

---

## 34. Faire un vrai test Live contrôlé

Stripe interdit l'utilisation de numéros de carte Test en mode Live.

Pour le test final :

1. Utiliser une vraie adresse de compte.
2. Acheter le forfait réel choisi avec une vraie carte.
3. Vérifier que le paiement apparaît dans Stripe Live.
4. Vérifier la ligne dans Supabase `subscriptions`.
5. Vérifier le statut PRO dans l'application.
6. Vérifier que le webhook Live retourne `200`.
7. Si ce paiement était uniquement un test, effectuer un remboursement depuis Stripe.
8. Vérifier les effets d'une annulation ou d'un remboursement selon la politique commerciale.

Un remboursement d'un accès à vie ne retire pas actuellement automatiquement l'accès dans le code. Cette règle devra être ajoutée avant de vendre largement les accès à vie.

---

# PARTIE H - DÉPANNAGE

## 35. Message « Les comptes seront disponibles dès que Supabase sera configuré »

Causes probables :

- `config.js` contient encore des valeurs vides;
- Vercel n'a pas redéployé la dernière version;
- l'ancien `config.js` est dans le cache PWA;
- la bibliothèque Supabase n'a pas chargé.

Actions :

1. Vérifier `config.js` dans GitHub.
2. Vérifier le dernier déploiement dans Vercel > **Deployments**.
3. Augmenter `CACHE_VERSION` dans `sw.js`.
4. Recharger avec `Ctrl+F5`.
5. Tester en navigation privée.

---

## 36. Erreur CORS

Le code autorise uniquement l'origine correspondant à `APP_URL`.

Vérifier que `APP_URL` contient exactement le domaine ouvert dans le navigateur.

Correct :

```text
APP_URL=https://un-petit-pas.vercel.app/
```

Incorrect si l'application est ouverte ailleurs :

```text
APP_URL=https://ancien-domaine.github.io/
```

Les URL de Preview Vercel changent et ne sont pas autorisées automatiquement par le code actuel.

---

## 37. Erreur `Invalid JWT`

Vérifier :

1. Que `create-checkout-session` et `create-portal-session` ont été déployées sans `--no-verify-jwt`.
2. Que l'utilisateur est connecté.
3. Que la clé publique de `config.js` est la clé `anon` du bon projet.
4. Que l'URL Supabase et la clé appartiennent au même projet.

Le code actuel s'appuie sur les clés Supabase historiques et devra être migré avant leur retrait définitif par Supabase.

---

## 38. Stripe Checkout ne s'ouvre pas

Ouvrir Supabase > **Edge Functions** > `create-checkout-session` > **Logs**.

Messages possibles :

- `Prix Stripe manquant` : mauvais nom de secret ou valeur vide;
- `URL publique manquante` : `APP_URL` absent;
- `Connexion requise` : utilisateur non connecté;
- `Impossible de démarrer le paiement` : clé Stripe ou identifiant de prix invalide.

Vérifier que la clé Stripe et les prix sont tous dans le même mode Test ou Live.

---

## 39. Paiement réussi mais PRO reste désactivé

1. Actualiser la page après quelques secondes.
2. Stripe > Workbench > Webhooks : ouvrir la livraison.
3. Vérifier le code HTTP retourné.
4. Supabase > Edge Functions > `stripe-webhook` > **Logs**.
5. Supabase > Table Editor > `subscriptions`.

Si le webhook retourne `400` :

- le `STRIPE_WEBHOOK_SECRET` est probablement incorrect;
- le secret Test et le secret Live ont peut-être été mélangés;
- la destination utilise peut-être des événements Thin au lieu de Snapshot.

---

## 40. Le portail d'abonnement ne s'ouvre pas

Vérifier :

1. Que le portail est activé dans le bon mode Stripe.
2. Que `subscriptions.stripe_customer_id` contient une valeur `cus_`.
3. Que l'utilisateur connecté est celui qui a payé.
4. Les journaux de `create-portal-session`.

---

## 41. Le courriel de confirmation n'arrive pas

1. Vérifier les pourriels.
2. Vérifier l'adresse saisie.
3. Supabase > Authentication > Users : vérifier si l'utilisateur existe.
4. Vérifier les journaux Auth Supabase.
5. Attendre avant de redemander plusieurs courriels.
6. Configurer un SMTP personnalisé avant la production.

---

# PARTIE I - CE QUI VA DANS GITHUB

## 42. Fichiers à publier

Publier tout le projet, y compris ce guide :

```text
docs/GUIDE_CONFIGURATION_PRODUCTION.md
```

Publier également :

```text
config.js
supabase/schema.sql
supabase/config.toml
supabase/functions/
```

`config.js` doit contenir uniquement l'URL Supabase, la clé publique `anon` et l'URL publique des fonctions.

## 43. Éléments à ne jamais publier

```text
sk_test_...
sk_live_...
whsec_...
service_role
.env
.supabase/
node_modules/
```

Si une clé secrète est accidentellement mise dans GitHub, la supprimer du fichier ne suffit pas. Il faut immédiatement la révoquer dans Stripe ou Supabase et en générer une nouvelle.

---

# PARTIE J - CHECKLIST FINALE

## 44. Avant d'inviter des testeurs

- [ ] `schema.sql` exécuté sans erreur
- [ ] Deux tables visibles dans Supabase
- [ ] Auth Email activée
- [ ] Site URL et Redirect URLs configurées
- [ ] `config.js` rempli
- [ ] Cache du service worker augmenté
- [ ] Site Vercel accessible en HTTPS
- [ ] Quatre prix Stripe Test créés
- [ ] Portail Stripe Test configuré
- [ ] Sept secrets présents dans Supabase
- [ ] Quatre Edge Functions déployées
- [ ] Webhook Test Snapshot configuré
- [ ] Inscription et confirmation testées
- [ ] Mensuel, annuel et accès à vie testés
- [ ] Annulation testée
- [ ] Paiement refusé testé

## 45. Avant d'accepter de vrais paiements

- [ ] Récupération complète du mot de passe développée
- [ ] Vérification après paiement rendue plus robuste
- [ ] Moyens de paiement différés désactivés ou pris en charge
- [ ] Compte Stripe entièrement vérifié
- [ ] Compte bancaire Stripe configuré
- [ ] SMTP Supabase professionnel configuré
- [ ] Politique de confidentialité publiée
- [ ] Conditions d'utilisation publiées
- [ ] Politique d'annulation et de remboursement publiée
- [ ] Quatre prix Live créés
- [ ] Portail Live configuré
- [ ] Webhook Live configuré
- [ ] Secrets Supabase remplacés par les valeurs Live
- [ ] Vrai paiement Live contrôlé avec succès
- [ ] Procédure de remboursement vérifiée

---

## Documentation officielle

- Supabase - SQL et base de données : <https://supabase.com/docs/guides/database/overview>
- Supabase - URL et clés API : <https://supabase.com/docs/guides/api>
- Supabase - Secrets Edge Functions : <https://supabase.com/docs/guides/functions/secrets>
- Supabase - Déployer les fonctions : <https://supabase.com/docs/guides/functions/deploy>
- Supabase - Auth et redirections : <https://supabase.com/docs/guides/auth/redirect-urls>
- Supabase - SMTP : <https://supabase.com/docs/guides/auth/auth-smtp>
- Stripe - Clés Test et Live : <https://docs.stripe.com/keys>
- Stripe - Produits et prix : <https://docs.stripe.com/products-prices/manage-prices>
- Stripe - Webhooks : <https://docs.stripe.com/webhooks>
- Stripe - Portail client : <https://docs.stripe.com/customer-management/configure-portal>
- Stripe - Cartes de test : <https://docs.stripe.com/testing>
- Vercel - Déployer depuis Git : <https://vercel.com/docs/git>
- Vercel - Site statique sans compilation : <https://vercel.com/docs/builds>
- Vercel - Domaines : <https://vercel.com/docs/domains/working-with-domains/add-a-domain>
