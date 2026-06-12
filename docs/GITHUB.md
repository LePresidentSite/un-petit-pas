# Quoi mettre dans GitHub

Publier le dossier `un-petit-pas` au complet, notamment :

- `index.html`
- `styles.css`
- `app.js`, `account.js`, `config.js`, `data.js`, `db.js`, `sw.js`
- `manifest.webmanifest`
- `assets/`
- `icons/`
- `supabase/`
- `docs/`
- `README.md`
- `.gitignore`

`config.js` peut être publié avec l'URL Supabase, la clé publique `anon` et l'URL des Edge Functions. Ces valeurs sont destinées au navigateur lorsque les règles RLS sont correctement configurées.

Ne jamais publier :

- une clé Stripe `sk_live_...` ou `sk_test_...`
- le secret webhook `whsec_...`
- la clé Supabase `service_role`
- un fichier `.env`
- les dossiers `node_modules/` ou `.supabase/`
- des journaux ou fichiers temporaires

GitHub Pages héberge l'interface PWA. Les fonctions de paiement du dossier `supabase/functions/` doivent aussi être déployées dans Supabase; elles ne s'exécutent pas directement sur GitHub Pages.
