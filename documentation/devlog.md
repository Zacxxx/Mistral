# Devlog

## 2026-02-28 - Initialisation architecture du projet

- Initialisation du repository local Git pour `BuildShield AI`.
- Mise en place d'une architecture mono-repo `pnpm`.
- Création du frontend `Next.js` dans `apps/web`.
- Création d'un backend serverless AWS (Serverless Framework + Lambda + API Gateway) dans `services/backend`.
- Ajout d'un package partagé `packages/shared` pour centraliser les schémas Zod et les types TypeScript.
- Ajout d'une première route API `POST /quotes/analyze` avec validation d'entrée.
- Documentation technique initiale ajoutée dans `documentation/architecture.md`.
