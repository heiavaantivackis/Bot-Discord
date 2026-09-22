# Gakuran Bot — Squelette professionnel

Base de départ pour ton bot Discord : gestion de gangs, classements ELO,
modération, événements, récompenses, recrutement, etc.

## Stack

- **discord.js v14** (TypeScript) — framework le plus mature et le mieux
  maintenu pour Discord en JS/TS (API complète, typage fort, communauté énorme).
- **Prisma + PostgreSQL** — ORM type-safe, migrations versionnées, zéro SQL
  brut concaténé (donc zéro injection SQL possible par construction).
- **Zod** — validation stricte des variables d'environnement et des entrées.
- **Pino** — logs structurés, avec redaction automatique des secrets.
- **ESLint + Prettier + Husky + lint-staged** — qualité de code, appliquée
  automatiquement avant chaque commit.
- **GitHub Actions** — CI (lint, typecheck) + scan de secrets (gitleaks).

## Pourquoi cette architecture

Chaque fonctionnalité de ton cahier des charges devient un **module**
indépendant dans `src/modules/<nom>/` avec ses propres `commands/` et
`events/`. Le `commandHandler` et `eventHandler` les chargent automatiquement :
**pour ajouter une fonctionnalité, tu ajoutes un fichier, tu ne touches à
rien d'autre.**

```
src/
  client.ts              # Client Discord étendu (+ Prisma attaché)
  config.ts              # Validation des .env (le bot refuse de démarrer si mal configuré)
  logger.ts              # Logs structurés, secrets jamais loggés
  handlers/               # Auto-chargement des commandes/événements
  security/
    rateLimiter.ts        # Anti-spam commandes + anti-flood messages
    permissions.ts        # Contrôle d'accès (grades de gang, arbitres...)
    linkSafety.ts         # Vérification de liens (Google Safe Browsing)
    captcha.ts            # Vérification anti-bot des nouveaux membres
  modules/
    ranking/               # Objet A — ELO
    moderation/             # Auto-modération
    gang/                   # Objet I
    events/                 # Objet C
    server/                 # Objet H
    welcome/                # Bienvenue + rôle auto
prisma/
  schema.prisma            # Modélise TOUS les objets A → K du cahier des charges
```

## Sécurité — ce qui est déjà en place

1. **Le token ne touche jamais Git** : `.env` est dans `.gitignore`, seul
   `.env.example` (vide) est versionné. `gitleaks` tourne en CI pour
   bloquer toute fuite accidentelle.
2. **Principe du moindre privilège** : le client Discord ne demande que les
   *intents* réellement utilisés (`src/client.ts`).
3. **Rate limiting** : cooldown par commande + détection de flood de
   messages (`src/security/rateLimiter.ts`). À migrer vers Redis si tu
   scales sur plusieurs shards.
4. **Contrôle d'accès** : les actions sensibles (lancer une alerte de
   combat, attribuer un grade) sont vérifiées côté serveur, jamais côté
   client (`src/security/permissions.ts`). Un chef de gang ne peut jamais
   s'auto-promouvoir au-dessus de son propre grade.
5. **Gestion d'erreurs** : aucune erreur interne (stack trace, requête SQL)
   n'est jamais renvoyée à l'utilisateur — seulement loggée côté serveur
   (`src/index.ts`).
6. **Validation stricte de la config** au démarrage (`src/config.ts`) :
   le bot ne démarre pas si une variable requise manque.
7. **Anti-SQL-injection par construction** grâce à Prisma (jamais de
   requêtes SQL concaténées à la main).

### À brancher (nécessitent un compte/API externe, volontairement laissés en TODO)

- **Modération d'image (NSFW/gore/objets illicites)** : à faire via une API
  spécialisée (Sightengine, AWS Rekognition, Google Vision SafeSearch) —
  point d'entrée prévu dans `src/modules/moderation/events/messageCreate.ts`.
- **Vérification de liens** : fonctionnelle si tu ajoutes une clé
  `GOOGLE_SAFE_BROWSING_API_KEY` dans `.env`.
- **Captcha visuel** : la logique de génération/validation existe
  (`src/security/captcha.ts`), il ne manque que le rendu de l'image
  (lib `@napi-rs/canvas` recommandée).

## Workflow Git recommandé

- `main` → toujours déployable en production.
- `develop` → intégration continue des features.
- `feature/<nom>` → une branche par fonctionnalité (ex: `feature/objet-e-alertes`),
  fusionnée dans `develop` via Pull Request.
- **Commits conventionnels** : `feat: ajoute le classement ELO`,
  `fix: corrige le cooldown du captcha`, `chore: maj dépendances`.
- Le hook `pre-commit` (Husky) lance automatiquement lint + format avant
  chaque commit — impossible de commit du code cassé ou mal formaté.
- Jamais de commit direct sur `main` : toujours via PR + review.

## Démarrage

```bash
git init
npm install
cp .env.example .env        # puis remplis DISCORD_TOKEN, DATABASE_URL, etc.
npx prisma migrate dev --name init
npm run dev
```

## Feuille de route (par phases, vu l'ampleur du cahier des charges)

Ce squelette pose les fondations + 2 modules complets en exemple
(`classement`, auto-modération). Voici l'ordre suggéré pour la suite,
du plus simple/impactant au plus complexe :

1. **Onboarding** : bienvenue + captcha + rôle auto (Objet H partiel)
2. **Profils Joueur/Gang** (Objets I, J) — base de tout le reste
3. **Modération complète** : mots interdits (CRUD via commandes), image
4. **Événements + Codes cadeaux** (Objets C, D) — simples, forte valeur perçue
5. **Récompenses** (Objet B)
6. **Classements & ELO** (déjà amorcé) — brancher la mise à jour post-match
7. **Alertes + Arbitrage** (Objet E) — le plus complexe (boutons, DM, tirage
   au sort, réservation de match). À découper en plusieurs sous-tâches.
8. **Réseaux sociaux** (Objet F) — nécessite des webhooks/API tierces
   (YouTube, TikTok...) selon les plateformes que tu veux suivre
9. **Recrutement** (Objet G)

Je peux enchaîner directement sur la Phase 1 si tu veux qu'on avance
module par module.
