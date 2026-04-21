# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 14 App Router frontend. Route files live under `app/`, with most business pages nested by company in `app/[company]/...`. Reusable UI lives in `components/`, shared state in `stores/` and `contexts/`, data hooks in `hooks/`, and cross-cutting utilities in `lib/`. Server-facing operations are grouped in `actions/` by domain, for example `actions/sms/` and `actions/mantenimiento/`. Static assets and fonts belong in `public/`.

## Build, Test, and Development Commands
- `npm run dev`: start the local development server on `http://localhost:3000`.
- `npm run build`: create the production build and catch compile-time issues.
- `npm run start`: serve the production build locally after `npm run build`.
- `npm run lint`: run the Next.js ESLint ruleset (`next/core-web-vitals`).

## Coding Style & Naming Conventions
Use TypeScript with strict mode enabled and prefer the `@/*` import alias over long relative paths. Prettier is configured for 2-space indentation, single quotes, trailing commas, and a 120-character line width. Follow the existing naming pattern: PascalCase for React components (`ContentLayout.tsx`), camelCase for hooks and utilities (`useDebounce.ts`), and descriptive route folders in lowercase. Keep domain-specific logic in `actions/` or `hooks/`, not inside page components.

## Testing Guidelines
There is no dedicated automated test suite checked in today. At minimum, run `npm run lint` and `npm run build` before opening a PR. For risky UI or workflow changes, manually verify the affected route under `app/[company]/...` and document what you tested. If you add tests, keep them close to the feature and use clear names such as `ComponentName.test.tsx`.

## Commit & Pull Request Guidelines
Recent history shows short, task-focused commits such as `fix de UI...` and `push para inicio de compras`. Keep commits small, imperative, and scoped to one change. Pull requests should include a short summary, impacted modules or routes, manual verification steps, and screenshots for visible UI changes. Link the related ticket or issue when one exists.

## Configuration Tips
Environment settings are stored in `.env`. Do not commit secrets or service credentials. When adding integrations, centralize request and session behavior in `lib/axios.ts`, `lib/session.ts`, or the relevant `actions/` module instead of duplicating configuration across pages.

## ⚠️ Common Gotchas & Traps

**Multi-tenant routing is mandatory.** Most routes nest under `app/[company]/...`. Creating routes at root-level breaks the company-scoped menu and navigation.

**`'use client'` directive required for hooks.** Any component using `useQuery()`, `useCompanyStore()`, `useMutation()`, or other React hooks must start with `'use client'`. Server components cannot use hooks.

**Auth token auto-injected by axios.** Don't manually add `Authorization` headers — `lib/axios.ts` interceptor injects it from the `auth_token` cookie. If auth fails, check that the cookie exists.

**Query invalidation is critical for mutations.** After a mutation succeeds, call `queryClient.invalidateQueries({ queryKey: ['resource'] })` to refresh data on screen. Forgetting this leaves stale data visible.

**Role-based access requires ProtectedLayout.** Routes don't auto-restrict by role. Wrap pages with `<ProtectedLayout roles={['role1', 'role2']} />` to enforce access control. Middleware only checks auth token presence.

**Toast library is Sonner, not Radix.** Use `toast.success()`, `toast.error()`, not `useToast()` (that's a different library). Import from `sonner`.

**OpenAPI types auto-generated.** Never edit `.gen/api/types.gen.ts` by hand — run `npm run api:generate` to regenerate from backend spec. Manual edits will be overwritten.

**LocalStorage persists company selection.** `CompanyStore` writes to localStorage. Opening multiple tabs can cause state syncing issues. Be aware when testing multi-tab workflows.

**Middleware redirects unauthenticated traffic.** If `auth_token` cookie is missing, any non-public route redirects to `/login`. Only `/` and `/login` are truly public.

## Common Workflows

**Creating a new business page:**
1. Place in `app/[company]/DOMAIN/feature/page.tsx`
2. Start with `'use client'` directive
3. Wrap content with `<ContentLayout title="..." />`
4. Use `useQuery()` hook to fetch data
5. Show loading state: `{isLoading && <Loader2 className="w-8 h-8 animate-spin" />}`
6. Show error state: `{isError && <p className="text-red-600">Error loading data...</p>}`
7. Render data: `{data && <YourComponent data={data} />}`

**Adding a mutation (create/update/delete):**
1. Create hook in `actions/DOMAIN/feature/actions.ts`: `export const useCreateX = () => useMutation({ ... })`
2. Call `axiosInstance.post('/endpoint', payload)`
3. On success: `queryClient.invalidateQueries({ queryKey: ['X'] })` + `toast.success('Created!')`
4. On error: `toast.error('Error: ' + error.message)`
5. Return mutation result from hook

**Displaying tabular data:**
- Use TanStack React Table with typed columns
- Store column definitions in a separate file
- Wrap table in `DataTable` or custom wrapper
- Include sorting, filtering, pagination from the library

**Styling consistently:**
- Follow the `.interface-design/system.md` typography hierarchy
- Use semantic status colors: `emerald-500` (approved), `red-500` (rejected), `amber-500` (pending)
- Use Tailwind utilities only; no inline styles
- Use `cn()` utility for conditional classes
