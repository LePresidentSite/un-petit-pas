# Un Petit Pas

PWA gratuite et hors ligne pour avancer doucement dans le ménage et l'organisation, avec une base optionnelle de comptes et d'abonnement PRO.

Adresse officielle : <https://unpetitpas.net>

Adresse technique de secours : <https://un-petit-pas.vercel.app>

## Fonctionnalités

- Mission et pensée motivante différentes chaque jour
- Parcours progressif de 31 Petits pas, repris automatiquement là où l'utilisateur s'est arrêté
- Désencombrement quotidien de 15 minutes avec coche datée et accès direct à la minuterie
- Routine quotidienne détaillée « Une lessive à la fois », en plus des routines matin, après-midi et soir
- Bibliothèque de 11 principes propres à Un Petit Pas
- Minuterie globale persistante de 15 minutes
- Pause, reprise, cercle de progression, son doux et écran de réussite
- Cycle automatique de cinq zones hebdomadaires
- 86 références d'entretien regroupées dans des accordéons, sans durée ni pression de complétion
- Indication de la zone active et de la dernière visite
- Routines personnalisables avec réorganisation
- Historique mensuel et compteur de petits pas
- Rappels locaux personnalisables
- Radios Ambiance avec bascule de station et reconnexion automatique après une coupure réseau
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

Le plan gratuit comprend notamment la minuterie, le programme hebdomadaire personnalisable, le parcours des Petits pas, la zone active de la semaine, trois tâches de routine personnalisées, trois favoris au total, un rappel fixe, quatre catégories Ambiance et sept jours d'historique détaillé. PRO déverrouille les cinq zones, les tâches et favoris illimités, plusieurs rappels personnalisés, toutes les autres ambiances, l'historique complet, les statistiques avancées et la sauvegarde infonuagique multiappareil.

La synchronisation PRO utilise la table `public.user_backups` définie dans `supabase/schema.sql`. Les données restent toujours disponibles localement dans IndexedDB; Supabase conserve un instantané de restauration uniquement pour les comptes dont le statut est `active` ou `trialing`.

Tarifs configurés dans Stripe :

- 4,99 $ CA par mois
- 29,99 $ CA par année
- 99,00 $ CA pour l'accès à vie
- 39,99 $ CA pour les 100 premiers accès Fondateur

Le premier abonnement mensuel ou annuel comprend 45 jours d'essai PRO. Les accès à vie ne comprennent pas de période d'essai.

## Données et notifications

Les routines et progressions restent dans IndexedDB sur l'appareil. Lorsqu'un compte est activé, Supabase conserve l'identité et le statut d'abonnement; Stripe traite les paiements. Les rappels utilisent l'API Notifications du navigateur et sont vérifiés lorsque l'application est ouverte ou autorisée à rester active en arrière-plan par le système. Une planification garantie lorsque l'application est complètement fermée nécessiterait un service de notifications poussées.

La section Ambiance conserve l'intention de lecture tant que l'utilisateur ne met pas la radio en pause ou ne l'arrête pas. En cas de flux interrompu, elle essaie les autres relais, puis recommence automatiquement avec un délai progressif de 1 à 30 secondes. Le retour du réseau déclenche une reprise immédiate. La Media Session du navigateur fournit aussi les commandes lecture, pause et arrêt sur les appareils compatibles. Comme toute application web, la lecture ne peut toutefois pas continuer si le navigateur ou la PWA est fermé de force par le système.
