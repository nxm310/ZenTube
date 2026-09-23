# ZenTube / SmartFeed 🧘‍♂️📺

> **Expérience YouTube apaisée, intentionnelle et respectueuse de votre attention.**

ZenTube est une application web moderne construite avec **Next.js (App Router)** conçue pour transformer votre consommation de vidéos YouTube :
- **SmartFeed thématique** : Un flux piloté par vos propres piliers d'apprentissage et centres d'intérêt.
- **Curseur de Sérendipité (0% à 100%)** : Dosage précis entre vos abonnements familiers et la découverte de nouvelles chaînes.
- **Anti-Redondance 15 Jours** : Masquage automatique des vidéos déjà visionnées ou écartées.
- **Nettoyage Anti-Clickbait** : Atténuation des titres racoleurs en majuscules et suppression des ponctuations tapageuses.
- **Mode One-Shot (Sandbox)** : Recherches ponctuelles et lecteur isolé via `youtube-nocookie.com` pour ne jamais polluer votre historique Google officiel.
- **Stratégie Zéro-Quota YouTube** : Synchronisation des abonnements via flux RSS natifs et playlists Uploads (`UU...`) pour préserver scrupuleusement le quota quotidien de 10 000 unités.

---

## 🏗️ Architecture & Organisation du Code

```
zentube/
├── prisma/
│   └── schema.prisma                  # Modèles User, Account, TopicPillar, WatchedVideo, Preferences
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # Handlers NextAuth Google OAuth + Refresh Token
│   │   │   ├── feed/route.ts                # Endpoint de génération du SmartFeed
│   │   │   ├── feed/interact/route.ts       # Like, Refresh, Pause 7j, Dismiss
│   │   │   ├── one-shot/search/route.ts     # Recherche sandboxée sans historique
│   │   │   ├── preferences/route.ts         # Sauvegarde du curseur de sérendipité
│   │   │   └── topics/route.ts              # Gestion des piliers thématiques
│   │   ├── dashboard/page.tsx               # Vue principale du flux épuré
│   │   ├── one-shot/page.tsx                # Page dédiée au mode Incognito One-Shot
│   │   ├── topics/page.tsx                  # Dashboard des piliers et du curseur
│   │   ├── layout.tsx                       # Layout racine avec SessionProvider et Navbar
│   │   └── page.tsx                         # Page d'accueil / vitrine
│   ├── components/
│   │   ├── feed/
│   │   │   ├── FeedCard.tsx                 # Carte vidéo avec actions rapides de modération
│   │   │   └── SerendipitySlider.tsx        # Curseur interactif 0-100%
│   │   ├── one-shot/
│   │   │   └── OneShotSandbox.tsx           # Lecteur isolé youtube-nocookie.com
│   │   └── layout/
│   │       └── Navbar.tsx                   # Barre de navigation
│   ├── lib/
│   │   ├── algorithms/
│   │   │   └── feedAggregator.ts            # Moteur de mixage, anti-redondance et dé-clickbait
│   │   ├── cache/
│   │   │   └── redis.ts                     # Cache TTL en mémoire ou Redis
│   │   ├── youtube/
│   │   │   ├── rss.ts                       # Parseur RSS zéro-quota (Atom/XML)
│   │   │   └── client.ts                    # Client API YouTube (Uploads UU..., batching)
│   │   ├── auth.ts                          # NextAuth configuration & token refresh
│   │   └── prisma.ts                        # Singleton Prisma Client
│   └── types/
│       └── index.ts                         # Types TypeScript partagés
└── .env.example
```

---

## ⚙️ Configuration & Démarrage

### 1. Variables d'environnement
Copiez `.env.example` vers `.env` et complétez vos clés :

```bash
cp .env.example .env
```

- `DATABASE_URL` : URL de connexion PostgreSQL (ex: Supabase, Neon ou conteneur local).
- `NEXTAUTH_SECRET` : Clé secrète générée pour chiffrer les sessions JWT.
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` : Identifiants OAuth créés sur la [Console Google Cloud](https://console.cloud.google.com/).
  - **Authorized Redirect URI** : `http://localhost:3000/api/auth/callback/google`
  - **Scopes requis** : `openid`, `email`, `profile`, `https://www.googleapis.com/auth/youtube.readonly`
- `YOUTUBE_API_SERVER_KEY` : Clé API YouTube Data v3 (utilisée pour les requêtes de sérendipité).

### 2. Base de données Prisma
Appliquez le schéma à votre base de données :

```bash
npx prisma db push
```

### 3. Lancer en mode développement
```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

---

## 🛡️ Respect des Quotas YouTube

L'API YouTube Data v3 impose un quota de **10 000 unités par jour** :
| Opération | Coût standard API | Solution ZenTube | Coût ZenTube |
|---|---|---|---|
| Dernières vidéos d'une chaîne | 100 unités (`search.list`) | Flux RSS de la chaîne | **0 unité** |
| Fallback abonnements | 100 unités (`search.list`) | Playlist Uploads (`UU...`) | **1 unité** |
| Détails vidéos (durée, etc.) | 1 unité / vidéo | Batching jusqu'à 50 IDs | **1 unité / 50 vidéos** |
| Découverte thématique | 100 unités | Requêtes mutualisées en cache | **100 unités / 12 heures** |
