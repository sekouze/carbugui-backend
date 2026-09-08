# CARBUGUI API

Backend Node.js / Express / Prisma (MySQL) pour Carbugui — l'application qui
localise en temps réel les stations-service de Guinée ayant de l'essence, du
gasoil ou du gaz, avec un tableau de bord pour les stations et un back-office
admin.

## ⛽ Fonctionnalités

- **Chauffeurs** : connexion par code SMS (OTP), recherche des stations à
  proximité, détail d'une station, signalement d'une info erronée, chat
  d'assistance (bot + escalade vers un agent).
- **Stations** : connexion par code + mot de passe (créé par un admin),
  mise à jour de la disponibilité/prix par produit, ouverture/fermeture,
  historique d'activité.
- **Admin** : gestion des comptes, des stations (CRUD + import
  OpenStreetMap), des marques/zones, supervision des signalements et des
  conversations.

## 🗂 Structure du projet

```
controllers/
  app/        Contrôleurs consommés par l'app chauffeur
  station/    Contrôleurs du tableau de bord station
  admin/      Contrôleurs du back-office
routes/       Mêmes sous-dossiers, un fichier de routes par domaine
middleware/   auth (JWT), requireStationAccess, errorHandler
utils/        prisma (client partagé), jwt, sms (NimbaSMS), email, geo,
              chatBot, stationImportService (OSM)
prisma/       schema.prisma, migrations, seed.js
```

## 🚀 Démarrage

```bash
npm install
cp .env.example .env   # puis renseigner les vraies valeurs
npx prisma migrate deploy
npm run seed            # crée les zones, le forfait mensuel et un compte admin
npm run dev
```

Le compte admin de démarrage est affiché dans la console par `npm run seed`
(`SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD` dans `.env` pour le personnaliser).
Changez son mot de passe après la première connexion.

## 🔌 API

Toutes les routes sont préfixées par `/api/{API_VERSION}` (`v1` par défaut).

| Domaine | Préfixe | Auth |
|---|---|---|
| Auth chauffeur (OTP) | `/app/auth` | public / Bearer |
| Stations (recherche) | `/app/stations` | public / Bearer optionnel |
| Chat | `/app/chat` | Bearer (DRIVER) |
| Auth station | `/station/auth` | public / Bearer |
| Tableau de bord station | `/station/dashboard` | Bearer (STATION) |
| Auth admin | `/admin/auth` | public / Bearer |
| Comptes | `/admin/accounts` | Bearer (ADMIN) |
| Stations | `/admin/stations` | Bearer (ADMIN) |
| Catalogue (marques/zones) | `/admin/catalog` | Bearer (ADMIN) |
| Signalements | `/admin/reports` | Bearer (ADMIN) |
| Chat (supervision) | `/admin/chat` | Bearer (ADMIN) |

La documentation interactive de l'API est servie sur `/api-docs` (Swagger UI).

Un canal WebSocket (même port que le serveur HTTP) diffuse les messages de
chat en temps réel : le client envoie `{ threadId, accountId }` pour
s'initialiser, puis `{ text }` pour envoyer un message.
