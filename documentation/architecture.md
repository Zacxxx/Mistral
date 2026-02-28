# Architecture initiale - BuildShield AI

## Choix techniques

- Frontend: Next.js (App Router) dans `apps/web`
- Backend API: AWS Lambda + API Gateway via Serverless Framework dans `services/backend`
- Modèle partagé (contrats de données): TypeScript + Zod dans `packages/shared`
- Gestion mono-repo: `pnpm-workspace`

## Schéma logique

1. Client web (Next.js) appelle l'API serverless via `NEXT_PUBLIC_API_BASE_URL`.
2. API Gateway route vers Lambdas dédiées (ex: `health`, `quotes/analyze`).
3. Lambdas valident les payloads avec les schémas partagés Zod.
4. Les résultats de scoring sont renvoyés au frontend.

## Structure dossiers

- `apps/web/src/app`: UI et routes Next.js
- `apps/web/src/lib`: clients/services frontend (réservé)
- `services/backend/src/handlers`: handlers Lambda
- `packages/shared/src`: schémas/types réutilisables
- `documentation`: docs projet

## Convention de croissance

- Une lambda par domaine métier (`quote`, `contract`, `cashflow`, `proof`).
- Un schéma d'entrée/sortie par cas d'usage dans `packages/shared`.
- Les endpoints exposent des réponses normalisées (`error code`, `details`, `trace id`).
- Ajouter ensuite:
  - persistance (DynamoDB ou PostgreSQL serverless)
  - auth (Cognito ou Clerk)
  - files (S3) pour upload contrats/photos
  - moteur IA (workers asynchrones)

## API MVP disponible

- `GET /health`: état de service
- `POST /quotes/analyze`: scoring simple de marge et risque délai
