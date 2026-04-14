# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 14 App Router frontend. Route files live under `app/`, with most business pages nested by company in `app/[company]/...`. Reusable UI lives in `components/`, shared state in `stores/` and `contexts/`, data hooks in `hooks/`, and cross-cutting utilities in `lib/`. Server-facing operations are grouped in `actions/` by domain, for example `actions/sms/` and `actions/mantenimiento/`. Static assets and fonts belong in `public/`.

## Build, Test, and Development Commands
- `npx eslint ./npx eslint {file}`: run the linter to check for code quality and style issues.
- `npx prettier --check .`: verify that code formatting matches the Prettier configuration.
- `npm run dev`: start the local development server on `http://localhost:3000`.
- `npm run build`: create the production build and catch compile-time issues.
- `npm run start`: serve the production build locally after `npm run build`.

## Coding Style & Naming Conventions
Use TypeScript with strict mode enabled and prefer the `@/*` import alias over long relative paths. Prettier is configured for 2-space indentation, single quotes, trailing commas, and a 120-character line width. Follow the existing naming pattern: PascalCase for React components (`ContentLayout.tsx`), camelCase for hooks and utilities (`useDebounce.ts`), and descriptive route folders in lowercase. Keep domain-specific logic in `actions/` or `hooks/`, not inside page components.

## Testing Guidelines
There is no dedicated automated test suite checked in today. At minimum, run `npm run lint` and `npm run build` before opening a PR. For risky UI or workflow changes, manually verify the affected route under `app/[company]/...` and document what you tested. If you add tests, keep them close to the feature and use clear names such as `ComponentName.test.tsx`.

## Commit & Pull Request Guidelines
Recent history shows short, task-focused commits such as `fix de UI...` and `push para inicio de compras`. Keep commits small, imperative, and scoped to one change. Pull requests should include a short summary, impacted modules or routes, manual verification steps, and screenshots for visible UI changes. Link the related ticket or issue when one exists.

## Configuration Tips
Environment settings are stored in `.env`. Do not commit secrets or service credentials. When adding integrations, centralize request and session behavior in `lib/axios.ts`, `lib/session.ts`, or the relevant `actions/` module instead of duplicating configuration across pages.
