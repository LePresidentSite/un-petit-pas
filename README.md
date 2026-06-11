# Un Petit Pas

PWA locale et hors ligne pour avancer doucement dans le ménage et l'organisation.

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

## Données et notifications

Toutes les données restent dans IndexedDB sur l'appareil. Les rappels utilisent l'API Notifications du navigateur et sont vérifiés lorsque l'application est ouverte ou autorisée à rester active en arrière-plan par le système. Une planification garantie lorsque l'application est complètement fermée nécessiterait un service de notifications poussées.
