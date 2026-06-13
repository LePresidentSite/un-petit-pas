# Un Petit Pas

PWA gratuite et hors ligne pour avancer doucement dans le ménage et l'organisation, avec une base optionnelle de comptes et d'abonnement PRO.

Adresse officielle : <https://unpetitpas.net>

Adresse technique de secours : <https://un-petit-pas.vercel.app>

## Fonctionnalités

- Mission, conseil et citation différents chaque jour
- Minuterie globale persistante avec modes 2, 5, 10, 15 et 30 minutes
- Pause, reprise, cercle de progression, son doux et écran de réussite
- Banque de 365 conseils d'organisation
- Cycle automatique de cinq zones hebdomadaires
- Mini-tâches et progression par pièce
- Routines personnalisables avec réorganisation
- Historique mensuel et compteur de petits pas
- Rappels locaux personnalisables
- Stockage IndexedDB, cache hors ligne et installation PWA
- Mise en page adaptative pour téléphone, tablette et ordinateur
- Identité scandinave premium avec navigation inférieure fixe
- Page À propos de Caroline avec photo, histoire, confidentialité et conditions
- Compte gratuit optionnel avec Supabase Auth
- Modèle Gratuit + PRO avec droits centralisés
- Paiements récurrents Stripe mensuels et annuels via Supabase Edge Functions
- Portail Stripe pour gérer ou annuler l'abonnement

## Lancer localement

La PWA doit être servie par HTTP plutôt qu'ouverte directement comme un fichier.

```powershell
python -m http.server 4173
```

Puis ouvrir `http://localhost:4173`.

## Installation

- Android/ordinateur : utiliser le bouton **Installer** ou le menu du navigateur.
- iPhone/iPad : dans Safari, utiliser **Partager**, puis **Sur l'écran d'accueil**.
- En production, déployer le dossier sur un hébergement HTTPS.

## Mode Gratuit + PRO

Sans configuration cloud, l'application reste entièrement utilisable en mode local gratuit. Pour activer les comptes et Stripe, suivre [docs/PRO_SETUP.md](docs/PRO_SETUP.md).

Pour publier le projet sans exposer de secrets, consulter [docs/GITHUB.md](docs/GITHUB.md).

Pour configurer Supabase, Stripe et Vercel pas à pas, consulter [docs/GUIDE_CONFIGURATION_PRODUCTION.md](docs/GUIDE_CONFIGURATION_PRODUCTION.md).

Le plan gratuit comprend notamment la minuterie, les missions, les zones essentielles, trois tâches de routine personnalisées, trois missions favorites et sept jours d'historique détaillé. PRO déverrouille les routines et favoris illimités, les heures de rappel personnalisées, les zones complètes, l'historique complet et les statistiques avancées.

Tarifs configurés dans Stripe :

- 4,99 $ CA par mois
- 29,99 $ CA par année
- 99,00 $ CA pour l'accès à vie
- 39,99 $ CA pour les 100 premiers accès Fondateur

Le premier abonnement mensuel ou annuel comprend 45 jours d'essai PRO. Les accès à vie ne comprennent pas de période d'essai.

## Données et notifications

Les routines et progressions restent dans IndexedDB sur l'appareil. Lorsqu'un compte est activé, Supabase conserve l'identité et le statut d'abonnement; Stripe traite les paiements. Les rappels utilisent l'API Notifications du navigateur et sont vérifiés lorsque l'application est ouverte ou autorisée à rester active en arrière-plan par le système. Une planification garantie lorsque l'application est complètement fermée nécessiterait un service de notifications poussées.
