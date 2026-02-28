# BuildShield AI Monorepo

Architecture de départ pour BuildShield AI:
- Frontend: Next.js (App Router)
- Backend: AWS Lambda via Serverless Framework
- Contrats partagés: package TypeScript partagé (`packages/shared`)

## Démarrage rapide

```bash
pnpm install
pnpm dev:web
pnpm dev:backend
```

## Structure

- `apps/web`: application Next.js
- `services/backend`: API serverless (AWS)
- `packages/shared`: types/schémas partagés
- `documentation`: architecture et devlog

Voir `documentation/architecture.md` pour les détails.
