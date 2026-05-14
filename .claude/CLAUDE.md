# CLAUDE.md — SaaS Immo Bénin

> Fichier de contexte pour Claude Code.
> Lire intégralement avant toute génération de code.
> Source de vérité pour toutes les décisions d'architecture.

---

## 1. Vue d'ensemble

Plateforme SaaS immobilière ciblant le marché béninois (lancement Cotonou).
Permet la visite virtuelle 3D des biens, la gestion complète du parcours locatif
(dossier, sélection, bail hybride) et la sécurisation financière via séquestre.

**Stack** : Turborepo monorepo — Next.js 14 App Router (web) + Hono (api) +
TypeScript + Drizzle ORM + PostgreSQL + Redis + BullMQ + Better Auth +
Cloudflare R2 + FedaPay + Kuula + Resend — hébergé sur VPS Hetzner CX22 via Coolify.

---

## 2. Stack Technique

| Couche | Technologie | Notes |
|---|---|---|
| Monorepo | Turborepo | Pipeline de build orchestré, cache partagé |
| Frontend | Next.js 14 (App Router) + React + TypeScript | SSR, SEO, Server Components |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first, composants headless |
| Formulaires | React Hook Form + Zod | Validation partagée via `@saas-immo/schemas` |
| State / Data | TanStack Query + Zustand | Cache serveur, état global minimal |
| Backend | Hono (Node.js) — `apps/api` | API REST dédiée, process séparé de Next.js |
| ORM | Drizzle ORM | Schéma TypeScript natif, migrations SQL lisibles |
| Validation | Zod | Schémas définis dans `packages/schemas` — jamais dupliqués |
| Auth | Better Auth | Sessions serveur, cookies HttpOnly, multi-rôles |
| Queue | BullMQ + Redis | Jobs asynchrones — scan, emails, PDF, paiements |
| Base de données | PostgreSQL | ACID strict — obligatoire pour les transactions financières |
| Cache / Sessions | Redis | Partagé entre Better Auth, BullMQ, rate limiting |
| Paiement | FedaPay API | Mobile money + carte, présent au Bénin |
| Emails | Resend + React Email | Templates dans `packages/emails` |
| Stockage fichiers | Cloudflare R2 (S3-compatible) | Deux buckets : quarantine + safe |
| Visite 3D | Kuula PRO | Intégration manuelle — embed iFrame, URL renseignée par admin |
| Infra | Hetzner CX22 VPS | 2 vCPU, 4 GB RAM, Ubuntu 24.04 |
| Orchestration | Coolify (self-hosted) | Déploiement, SSL Traefik, env vars |
| CI/CD | GitHub Actions | lint → typecheck → test → build → deploy |
| Tests | Vitest (unit/integration) + Playwright (E2E) | Obligatoires — bloquants en CI |

---

## 3. Structure de Dossiers

```
saas-immo/
│
├── apps/
│   ├── web/                          ← Next.js 14 (App Router)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/           ← login, register
│   │   │   │   ├── (public)/         ← listings, détail bien
│   │   │   │   └── (dashboard)/
│   │   │   │       ├── owner/
│   │   │   │       ├── tenant/
│   │   │   │       └── admin/
│   │   │   ├── components/
│   │   │   │   ├── ui/               ← shadcn/ui (généré — ne pas modifier)
│   │   │   │   └── [feature]/        ← composants métier par feature
│   │   │   └── lib/
│   │   │       ├── auth-client.ts    ← Better Auth client-side uniquement
│   │   │       └── api-client.ts     ← fetch wrapper vers apps/api
│   │   ├── .env.local
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                          ← Hono (REST API)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── assets.ts
│       │   │   ├── applications.ts
│       │   │   ├── leases.ts
│       │   │   ├── payments.ts
│       │   │   ├── tours.ts
│       │   │   ├── uploads.ts
│       │   │   └── webhooks.ts
│       │   ├── services/             ← logique métier pure — pas d'accès HTTP direct
│       │   │   ├── asset.service.ts
│       │   │   ├── application.service.ts
│       │   │   ├── lease.service.ts
│       │   │   ├── payment.service.ts
│       │   │   ├── upload.service.ts
│       │   │   └── escrow.service.ts
│       │   ├── workers/              ← BullMQ — process séparé de Hono
│       │   │   ├── index.ts          ← entry point — démarre tous les workers
│       │   │   ├── queues.ts         ← définition des 4 queues (source de vérité)
│       │   │   ├── scan.worker.ts
│       │   │   ├── email.worker.ts
│       │   │   ├── pdf.worker.ts
│       │   │   └── payment.worker.ts
│       │   ├── lib/
│       │   │   ├── auth.ts           ← Better Auth server-side
│       │   │   ├── r2.ts
│       │   │   ├── fedapay.ts
│       │   │   ├── resend.ts
│       │   │   ├── redis.ts
│       │   │   └── permissions.ts   ← source de vérité des permissions
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   └── rate-limit.middleware.ts
│       │   └── index.ts              ← point d'entrée Hono (port 4000)
│       ├── .env
│       └── package.json
│
├── packages/
│   ├── db/                           ← Drizzle schema + client
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── index.ts          ← re-export de toutes les tables
│   │   │   │   ├── users.ts
│   │   │   │   ├── assets.ts
│   │   │   │   ├── applications.ts
│   │   │   │   ├── leases.ts
│   │   │   │   ├── payments.ts
│   │   │   │   └── tours.ts
│   │   │   ├── relations.ts          ← toutes les relations Drizzle
│   │   │   └── index.ts              ← export { db, schema }
│   │   ├── migrations/               ← fichiers SQL générés par drizzle-kit
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── schemas/                      ← Zod schemas partagés web + api
│   │   ├── src/
│   │   │   ├── asset.schema.ts
│   │   │   ├── application.schema.ts
│   │   │   ├── lease.schema.ts
│   │   │   ├── payment.schema.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/                        ← Types TypeScript partagés
│   │   ├── src/
│   │   │   ├── api.types.ts          ← types requêtes/réponses API
│   │   │   ├── roles.types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── emails/                       ← Templates React Email
│       ├── src/
│       │   ├── application-submitted.tsx
│       │   ├── application-selected.tsx
│       │   ├── application-rejected.tsx
│       │   ├── document-validated.tsx
│       │   ├── document-rejected.tsx
│       │   ├── tour-scheduled.tsx
│       │   ├── tour-published.tsx
│       │   ├── lease-created.tsx
│       │   ├── lease-signed.tsx
│       │   ├── commission-requested.tsx
│       │   └── payment-succeeded.tsx
│       └── package.json
│
├── docker-compose.yml                ← PostgreSQL + Redis (dev local)
├── turbo.json
├── package.json                      ← workspace root
├── .env.example
└── CLAUDE.md                         ← ce fichier
```

---

## 4. Conventions de Code

### Langue
- Code, variables, fonctions, commentaires, commits : **anglais uniquement**
- UI visible par l'utilisateur : français (marché béninois)

### Nommage

| Élément | Convention |
|---|---|
| Variables | camelCase |
| Fonctions | camelCase |
| Classes | PascalCase |
| Constantes | UPPER_SNAKE_CASE |
| Fichiers TypeScript / React | kebab-case |
| Composants React | PascalCase (fichier + nom du composant) |
| Tables Drizzle | snake_case (via option `name` dans `pgTable`) |

### Style

- Indentation : 4 espaces
- Commentaires : uniquement sur les parties complexes — pas de commentaires évidents
- Pas de JSDoc / docstrings
- Gestion d'erreurs : défensive — try/catch systématique sur toute opération I/O
- Paradigme : pragmatique — fonctionnel par défaut, classes uniquement si justifié
- Performance > lisibilité en cas de conflit

### Règles strictes

- **Jamais** de `any` TypeScript — utiliser `unknown` + type guard si nécessaire
- **Jamais** accéder à `packages/db` directement depuis `apps/web` — la DB est un détail d'implémentation de `apps/api`
- **Jamais** accéder à Drizzle directement dans un route handler Hono — passer par `apps/api/src/services/`
- **Jamais** stocker une URL R2 en base — stocker uniquement la clé (`r2Key`)
- **Jamais** de `Float` pour les montants monétaires — uniquement `Int` en XOF
- **Jamais** générer une presigned URL sans vérifier les permissions sur la ressource
- **Jamais** de logique métier dans `apps/api/src/workers/` — appeler les services
- Un seul client Drizzle (singleton dans `packages/db/src/index.ts`) — ne jamais instancier ailleurs

---

## 5. Schéma de Données

Fichier source : `packages/db/src/schema/`

### Graphe de dépendances packages

```
apps/web   → packages/schemas, packages/types
apps/api   → packages/db, packages/schemas, packages/types, packages/emails
packages/db       → (feuille)
packages/schemas  → (feuille)
packages/types    → (feuille)
packages/emails   → packages/types
```

### Nommage des packages workspace

| Dossier | Nom npm interne |
|---|---|
| `packages/db` | `@saas-immo/db` |
| `packages/schemas` | `@saas-immo/schemas` |
| `packages/types` | `@saas-immo/types` |
| `packages/emails` | `@saas-immo/emails` |
| `apps/web` | `@saas-immo/web` |
| `apps/api` | `@saas-immo/api` |

### Règles critiques

**Argent** : tous les montants sont en XOF, type `integer` Drizzle. Jamais `real`,
`doublePrecision` ou `numeric` pour les montants. Le XOF n'a pas de sous-unité.

**Asset (D-09)** : entité abstraite centrale. `type` discrimine entre `PROPERTY`
(v1) et `VEHICLE` (v2). Les détails spécifiques sont dans `PropertyDetails` et
`VehicleDetails` (1-1). Ne jamais ajouter de champs immo-spécifiques directement
sur `assets`.

**R2 keys** : les champs `r2Key`, `r2KeyQuarantine`, `r2KeySafe`, `r2KeyPdf` sont
des clés d'objet R2 — jamais des URLs publiques. Les URLs sont générées à la
volée via presigned URLs (expiration 15 minutes).

**ApplicationDocument** : deux clés R2 distinctes :
- `r2KeyQuarantine` : fichier uploadé, en attente de scan ClamAV
- `r2KeySafe` : fichier validé, accessible aux utilisateurs autorisés
Un document n'a jamais les deux clés renseignées simultanément.

**Escrow** : table présente en v1, flux désactivé. Aucune route API n'expose le
flux séquestre tant que la validation juridique (S-04) n'est pas confirmée.

**Payment idempotence** : `fedaPayTransactionId` a une contrainte `unique`.
Avant tout traitement d'un webhook FedaPay, vérifier que cet ID n'existe pas
déjà en base avec statut `SUCCEEDED`.

### Entités principales

```
User (1) ──── (N) Asset          [ownerId]
User (1) ──── (N) Application    [tenantId]
Asset (1) ─── (1) PropertyDetails
Asset (1) ─── (1) VehicleDetails  [vide en v1]
Asset (1) ─── (N) AssetMedia
Asset (1) ─── (1) VirtualTourOrder
Asset (1) ─── (N) Application
Asset (1) ─── (1) Lease
Application (1) ── (N) ApplicationDocument
Application (1) ── (1) Escrow
Application (1) ── (1) Lease
Lease (1) ──── (1) Payment        [commission — Flux 2]
VirtualTourOrder (1) ── (1) Payment  [tour fee — Flux 1]
Escrow (1) ─── (1) Payment        [séquestre — Flux 3, v2]
```

---

## 6. Variables d'Environnement

Les variables d'environnement sont **strictement séparées** entre les deux apps.
Aucun secret backend ne doit apparaître dans `apps/web`.

### apps/web/.env.local

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### apps/api/.env

```
# DATABASE
DATABASE_URL="postgresql://user:password@localhost:5432/immo_benin"

# REDIS
REDIS_URL="redis://localhost:6379"

# AUTH — Better Auth
BETTER_AUTH_SECRET=""        # Clé aléatoire 32+ caractères
BETTER_AUTH_URL=""           # URL publique de l'API (ex: https://api.mondomaine.com)

# CLOUDFLARE R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_QUARANTINE=""      # Bucket fichiers en attente de scan
R2_BUCKET_SAFE=""            # Bucket fichiers validés
R2_ENDPOINT=""               # https://<account_id>.r2.cloudflarestorage.com

# FEDAPAY
FEDAPAY_SECRET_KEY=""        # Clé secrète API
FEDAPAY_WEBHOOK_SECRET=""    # Secret HMAC validation webhooks
FEDAPAY_ENV=""               # "sandbox" | "live"

# RESEND
RESEND_API_KEY=""
RESEND_FROM_EMAIL=""         # ex: noreply@mondomaine.com

# APP
NODE_ENV=""                  # "development" | "production"
```

---

## 7. Routes API

Toutes les routes sont définies dans `apps/api` (Hono). Le préfixe de base est `/`.
`apps/web` consomme ces routes via `lib/api-client.ts`.

### Auth — `/auth/*`
Géré par Better Auth — ne pas réécrire manuellement.

### Assets — `/assets`

| Méthode | Route | Rôle | Action |
|---|---|---|---|
| `GET` | `/assets` | Public | Lister les biens publiés (filtres) |
| `GET` | `/assets/:id` | Public | Détail d'un bien |
| `POST` | `/assets` | OWNER | Créer un bien |
| `PATCH` | `/assets/:id` | OWNER 🔒 | Modifier un bien |
| `DELETE` | `/assets/:id` | OWNER 🔒 | Archiver un bien |
| `GET` | `/assets/mine` | OWNER | Lister ses propres biens |
| `POST` | `/assets/:id/media` | OWNER 🔒 | Ajouter des photos |
| `DELETE` | `/assets/:id/media/:mediaId` | OWNER 🔒 | Supprimer une photo |

### Visites 3D — `/tours`

| Méthode | Route | Rôle | Action |
|---|---|---|---|
| `POST` | `/tours` | OWNER 🔒 (proprio bien) | Commander une visite 3D |
| `GET` | `/tours/:id` | OWNER 🔒 / ADMIN | Détail d'une commande |
| `PATCH` | `/tours/:id` | ADMIN | Mettre à jour le statut |
| `PATCH` | `/tours/:id/kuula` | ADMIN | Renseigner l'URL Kuula manuellement |
| `GET` | `/tours` | ADMIN | Lister toutes les commandes |

### Uploads — `/uploads`

| Méthode | Route | Rôle | Action |
|---|---|---|---|
| `POST` | `/uploads/presign` | Authentifié | Générer une presigned URL R2 |
| `POST` | `/uploads/confirm` | Authentifié | Confirmer l'upload, enqueuer scan |

### Applications — `/applications`

| Méthode | Route | Rôle | Action |
|---|---|---|---|
| `POST` | `/applications` | TENANT | Créer un dossier |
| `GET` | `/applications/:id` | TENANT 🔒 / OWNER 🔒 / ADMIN | Détail d'un dossier |
| `PATCH` | `/applications/:id` | TENANT 🔒 (avant soumission) | Modifier le dossier |
| `POST` | `/applications/:id/submit` | TENANT 🔒 | Soumettre le dossier |
| `POST` | `/applications/:id/withdraw` | TENANT 🔒 | Retirer sa candidature |
| `GET` | `/applications/asset/:assetId` | OWNER 🔒 (proprio bien) | Lister les dossiers reçus |
| `POST` | `/applications/:id/select` | OWNER 🔒 (proprio bien) | Sélectionner un locataire |
| `POST` | `/applications/:id/reject` | OWNER 🔒 (proprio bien) | Rejeter un dossier |
| `POST` | `/applications/:id/documents` | TENANT 🔒 | Ajouter un document |
| `DELETE` | `/applications/:id/documents/:docId` | TENANT 🔒 | Supprimer un document |

### Baux — `/leases`

| Méthode | Route | Rôle | Action |
|---|---|---|---|
| `POST` | `/leases` | OWNER 🔒 (proprio bien) / ADMIN | Créer un bail |
| `GET` | `/leases/:id` | OWNER 🔒 / TENANT 🔒 / ADMIN | Détail d'un bail |
| `PATCH` | `/leases/:id/sign` | ADMIN | Marquer comme signé physiquement |
| `PATCH` | `/leases/:id/archive` | ADMIN | Uploader PDF scanné + archiver |
| `GET` | `/leases/mine` | OWNER / TENANT | Lister ses baux |

### Paiements — `/payments`

| Méthode | Route | Rôle | Action |
|---|---|---|---|
| `POST` | `/payments/tour` | OWNER 🔒 (proprio bien) | Initier paiement visite 3D |
| `POST` | `/payments/commission` | ADMIN | Déclencher commission (manuel) |
| `GET` | `/payments/:id` | ADMIN / userId concerné 🔒 | Détail d'un paiement |

### Webhooks — `/webhooks`

| Méthode | Route | Rôle | Action |
|---|---|---|---|
| `POST` | `/webhooks/fedapay` | Public (HMAC validé) | Recevoir événements FedaPay |

### Admin — `/admin`

| Méthode | Route | Rôle | Action |
|---|---|---|---|
| `GET` | `/admin/users` | ADMIN | Lister tous les utilisateurs |
| `PATCH` | `/admin/users/:id/role` | ADMIN | Modifier le rôle d'un utilisateur |
| `GET` | `/admin/stats` | ADMIN | Statistiques globales |

> 🔒 = autorisé uniquement si propriétaire de la ressource (vérification en base obligatoire)

---

## 8. Permissions

Fichier source de vérité : `apps/api/src/lib/permissions.ts`

Les permissions ne sont **jamais** vérifiées avec des `if (user.role === 'OWNER')`
dispersés dans le code. Toujours utiliser la fonction `can(user, action, resource?)`.

### Règles spéciales

- Un `OWNER` ne voit les documents d'un dossier que si `application.status` >=
  `SUBMITTED` — jamais sur un dossier en `DRAFT`
- Un `TENANT` ne voit que ses propres dossiers
- Un `OWNER` ne voit que les dossiers reçus sur ses propres biens
- Un bien en `DRAFT` ou `TOUR_PENDING` n'est visible que par son propriétaire
  et les admins — jamais en listing public

### Matrice condensée

| Action | PUBLIC | TENANT | OWNER | ADMIN |
|---|---|---|---|---|
| `asset:read:published` | ✅ | ✅ | ✅ | ✅ |
| `asset:read:own` | ❌ | ❌ | 🔒 | ✅ |
| `asset:create` | ❌ | ❌ | ✅ | ✅ |
| `asset:update` | ❌ | ❌ | 🔒 | ✅ |
| `asset:delete` | ❌ | ❌ | 🔒 | ✅ |
| `tour:create` | ❌ | ❌ | 🔒 | ✅ |
| `tour:update` | ❌ | ❌ | ❌ | ✅ |
| `application:create` | ❌ | ✅ | ❌ | ✅ |
| `application:read:own` | ❌ | 🔒 | ❌ | ✅ |
| `application:read:received` | ❌ | ❌ | 🔒 | ✅ |
| `application:select` | ❌ | ❌ | 🔒 | ✅ |
| `document:read` | ❌ | 🔒 | 🔒* | ✅ |
| `document:upload` | ❌ | 🔒 | ❌ | ✅ |
| `lease:create` | ❌ | ❌ | 🔒 | ✅ |
| `lease:read:own` | ❌ | 🔒 | 🔒 | ✅ |
| `lease:sign` | ❌ | ❌ | ❌ | ✅ |
| `lease:archive` | ❌ | ❌ | ❌ | ✅ |
| `payment:tour:create` | ❌ | ❌ | 🔒 | ✅ |
| `payment:commission:trigger` | ❌ | ❌ | ❌ | ✅ |
| `escrow:*` | ❌ | ❌ | ❌ | ✅ |

> 🔒* = OWNER peut lire les documents uniquement si `application.status` >= `SUBMITTED`

---

## 9. Jobs BullMQ

Définis dans `apps/api/src/workers/queues.ts`. 4 queues — noms exacts à respecter :

- `scan-queue`
- `email-queue`
- `pdf-queue`
- `payment-queue`

### scan-queue

**Trigger** : `POST /uploads/confirm`

| Job | Payload |
|---|---|
| `scan-document` | `{ documentId, r2KeyQuarantine, mimeType, sizeBytes }` |

**Pipeline** :
1. Télécharger depuis R2 quarantine vers `/tmp`
2. Vérifier magic bytes (`file-type`)
3. Vérifier taille <= 10 MB
4. Strip EXIF si image (`sharp`)
5. Scanner ClamAV on-demand (`clamscan` binaire — pas de daemon)
6. CLEAN → déplacer vers R2 safe → supprimer quarantine → `VALIDATED` en base → enqueuer email
7. INFECTED → supprimer quarantine → `REJECTED` en base → enqueuer email

**Retry** : `{ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }`

### email-queue

**Trigger** : enqueuée par workers ou services — jamais directement par le client

| Job | Destinataire |
|---|---|
| `application-submitted` | OWNER |
| `application-selected` | TENANT |
| `application-rejected` | TENANT |
| `document-validated` | TENANT |
| `document-rejected` | TENANT |
| `tour-scheduled` | OWNER |
| `tour-published` | OWNER |
| `lease-created` | OWNER + TENANT |
| `lease-signed` | OWNER + TENANT |
| `commission-requested` | OWNER |
| `payment-succeeded` | userId concerné |

**Retry** : `{ attempts: 5, backoff: { type: 'exponential', delay: 2000 } }`
**Idempotence** : passer `idempotencyKey` à l'API Resend sur chaque envoi.

### pdf-queue

**Trigger** : `PATCH /leases/:id/sign`

| Job | Payload |
|---|---|
| `generate-lease-pdf` | `{ leaseId }` |

**Pipeline** :
1. Récupérer le bail complet en base
2. Générer PDF (react-pdf ou pdfkit)
3. Uploader sur R2 safe (jamais quarantine — fichier interne)
4. Mettre à jour `r2KeyPdf` + `archivedAt` sur `leases`
5. Lease status → `ARCHIVED`
6. Enqueuer `lease-signed` dans email-queue

**Retry** : `{ attempts: 3, backoff: { type: 'fixed', delay: 10000 } }`

### payment-queue

**Trigger** : webhook FedaPay → handler enqueues immédiatement

| Job | Payload |
|---|---|
| `payment-tour-succeeded` | `{ fedaPayTransactionId, tourOrderId, paymentId }` |
| `payment-commission-succeeded` | `{ fedaPayTransactionId, leaseId, paymentId }` |
| `payment-failed` | `{ fedaPayTransactionId, paymentId }` |
| `payment-refunded` | `{ fedaPayTransactionId, paymentId }` |

**Idempotence obligatoire** : première action dans chaque job —
vérifier si `fedaPayTransactionId` existe déjà en base avec statut `SUCCEEDED`.
Si oui → ignorer silencieusement, ne pas rejeter le job.

**Retry** : `{ attempts: 5, backoff: { type: 'exponential', delay: 3000 } }`

---

## 10. Webhooks FedaPay

### Endpoint : `POST /webhooks/fedapay`

**Règle absolue** : entre la validation HMAC et le `200`, aucune logique métier,
aucun accès base de données. Uniquement : valider → enqueuer → `200`.

Pipeline exact — ne pas dévier :
1. Lire le body raw avant tout parsing
2. Valider la signature HMAC — `401` si invalide
3. Parser le body JSON
4. Enqueuer dans `payment-queue`
5. Retourner `200` immédiatement

### Métadonnées FedaPay (custom_metadata)

À passer obligatoirement lors de la création de chaque transaction :
- Visite 3D : `{ type: 'TOUR_FEE', tourOrderId, paymentId }`
- Commission : `{ type: 'COMMISSION', leaseId, paymentId }`

### Événements gérés

| Événement FedaPay | Job enqueuée |
|---|---|
| `transaction.approved` + `TOUR_FEE` | `payment-tour-succeeded` |
| `transaction.approved` + `COMMISSION` | `payment-commission-succeeded` |
| `transaction.declined` | `payment-failed` |
| `transaction.refunded` | `payment-refunded` |
| `transaction.created` | Ignoré |
| `transaction.canceled` | `payment-failed` |

### Cas edge

| Cas | Comportement |
|---|---|
| `paymentId` introuvable en base | Log erreur + alerte admin + `200` quand même |
| Payment déjà `SUCCEEDED` en base | Ignorer silencieusement + `200` |
| Signature HMAC invalide | `401` — FedaPay ne retente pas sur `4xx` |
| Worker crash pendant traitement | BullMQ retry — idempotence protège |

---

## 11. Sécurité

### Auth

- Sessions serveur uniquement — cookies `HttpOnly + Secure + SameSite=Strict`
- Pas de JWT stocké dans `localStorage` ou `sessionStorage`
- Better Auth gère les sessions — ne pas réimplémenter

### Fichiers R2

- Bucket quarantine et bucket safe sont **privés** — aucun accès public
- Presigned URLs uniquement — expiration 15 minutes maximum
- Vérification des permissions avant toute génération de presigned URL
- Validation magic bytes obligatoire (`file-type`)
- Types MIME autorisés : `application/pdf`, `image/jpeg`, `image/png` uniquement
- SVG **strictement interdit** en upload utilisateur
- Taille maximale : 10 MB par fichier
- Strip EXIF systématique sur les images (`sharp`)
- Scan ClamAV on-demand avant tout déplacement vers bucket safe

### Paiements

- Validation HMAC sur tous les webhooks FedaPay (`timingSafeEqual` obligatoire)
- Idempotence via `fedaPayTransactionId` unique en base

### Rate Limiting (middleware Hono + Redis)

| Route | Limite |
|---|---|
| `POST /auth/login` | 5 req / 15 min / IP |
| `POST /auth/register` | 10 req / heure / IP |
| `POST /payments/*` | 20 req / heure / userId |
| Routes publiques listing | 100 req / min / IP |

### Headers HTTP (middleware Hono)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin
Permissions-Policy: camera=(), microphone=()
Content-Security-Policy: default-src 'self'; frame-src kuula.co
```

---

## 12. Tests

### Périmètre obligatoire

Les tests sont **bloquants en CI** — un PR ne merge pas si les tests échouent.

| Type | Outil | Périmètre |
|---|---|---|
| Unit / Integration | Vitest | Services, workers, schemas Zod, permissions |
| E2E | Playwright | Parcours critiques — paiement, upload, candidature, bail |
| API | Hono test client | Route handlers isolés |

### Parcours E2E critiques (non négociables)

- Propriétaire crée un bien → commande visite 3D → paie
- Locataire dépose un dossier → uploade documents → soumet
- Propriétaire sélectionne un locataire → rejette les autres automatiquement
- Admin signe un bail → commission déclenchée

---

## 13. Règles Métier Critiques

### Flux de revenus

**Flux 1 — Visite 3D**
- Commandée par le propriétaire lors de la mise en ligne du bien
- Paiement requis avant planification du tournage
- Revenu acquis définitivement dès que la visite est tournée
- Statuts : `PENDING_PAYMENT` → `PAID` → `SCHEDULED` → `SHOT` → `PUBLISHED`

**Flux 2 — Commission**
- Déclenchée uniquement après signature physique du bail
- Facturée au propriétaire — déclenchement manuel par ADMIN en v1
- `Payment` créé en `PENDING` à la signature → ADMIN déclenche la demande FedaPay
- Commission par tranche de loyer mensuel :
  - < 100 000 XOF → 15 000 XOF
  - 100 000 – 300 000 XOF → 35 000 XOF
  - > 300 000 XOF → 60 000 XOF

**Flux 3 — Séquestre**
- Structure présente en base, flux **désactivé en v1**
- Aucune route API ne doit exposer ce flux avant validation juridique (S-04)

### Statuts Asset

```
DRAFT → TOUR_PENDING → PUBLISHED → RENTED → ARCHIVED
```
- Un bien `DRAFT` ou `TOUR_PENDING` est invisible en listing public
- Un bien `RENTED` ne peut pas recevoir de nouvelles candidatures
- Un bien `ARCHIVED` est en lecture seule

### Contraintes d'intégrité métier

- Un locataire ne peut avoir qu'une seule candidature active par bien
  (contrainte `unique` sur `(assetId, tenantId)` dans `applications`)
- Un bien ne peut avoir qu'un seul bail actif (contrainte `unique` sur `assetId` dans `leases`)
- Sélectionner un locataire doit automatiquement rejeter tous les autres
  dossiers `SUBMITTED` sur le même bien
- Un bail ne peut être créé que si l'application associée est en statut `SELECTED`

---

## 14. Hors Scope v1

Ne pas implémenter les éléments suivants — ils seront traités en v2 :

| Feature | Raison |
|---|---|
| Application mobile (Expo RN) | Web responsive suffit |
| Flux séquestre locataire | Validation juridique requise (S-04) |
| Location de véhicule | Décision D-08 — v2 uniquement |
| Notifications push | Pas de cas d'usage critique en v1 |
| Recherche full-text avancée | `pg_trgm` PostgreSQL suffit |
| Automatisation API Kuula | Intégration manuelle suffisante au volume v1 |
| Analytics produit (PostHog) | Post-lancement |
| 2FA | Confort utilisateur — v2 |
| Multi-tenant agences | Row-level isolation suffit en v1 |
| WebSockets / notifications temps réel | Pas de cas d'usage critique en v1 |

---

*Version : 2.0 — Monorepo Turborepo, backend Hono, Drizzle ORM, tests obligatoires*
*Mettre à jour ce fichier à chaque décision d'architecture validée*
