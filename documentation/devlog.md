# Devlog

## 2026-02-28 - Initialisation architecture du projet

- Initialisation du repository local Git pour `BuildShield AI`.
- Mise en place d'une architecture mono-repo `pnpm`.
- Création du frontend `Next.js` dans `apps/web`.
- Création d'un backend serverless AWS (Serverless Framework + Lambda + API Gateway) dans `services/backend`.
- Ajout d'un package partagé `packages/shared` pour centraliser les schémas Zod et les types TypeScript.
- Ajout d'une première route API `POST /quotes/analyze` avec validation d'entrée.
- Documentation technique initiale ajoutée dans `documentation/architecture.md`.

## 2026-02-28 - Test Stabilization and Major Fixes

- Fixed all frontend and backend test failures (100% pass rate).
- Implemented global mocks for browser APIs (`SpeechRecognition`, `URL`) and external services (`AWS Amplify`, `TensorFlow`) to stabilize the test environment.
- Resolved critical missing dependencies: `file-type`, `pdf-lib`, `mammoth`, and `lodash`.
- Standardized imports for `compromise` and `lodash` to ensure reliability in Vitest/SSR environments.
- Performed a major refactor of the Quote feature's type system, unifying `Material` and `CostItem` types.
- Implemented the missing `Progress` UI component in `src/components/ui/progress.tsx`.
- Refined form validation logic in `Login.tsx` and aligned component placeholders with test expectations.
