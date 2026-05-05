# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npx eslint ./npx eslint {file}`: run the linter to check for code quality and style issues.
- `npx prettier --check .`: verify that code formatting matches the Prettier configuration.
- `npm run dev` — start dev server on `http://localhost:3000`
- `npm run build` — production build (also catches TypeScript/compile errors)
- `npm run start` — serve the production build locally

There is no automated test suite. Before PRs, run `npm run lint` and `npm run build`, and manually verify the affected route under `app/[company]/...`.

## Architecture

**Stack:** Next.js 14 App Router · React 18 · TypeScript (strict) · Tailwind CSS · shadcn/ui

### Directory Layout

| Path | Purpose |
|------|---------|
| `app/[company]/...` | Business pages, dynamic company namespace (multi-tenant routing) |
| `components/` | Reusable UI: `ui/` (shadcn primitives), `forms/`, `tables/`, `dialogs/`, `layout/`, `pdf/` |
| `actions/` | Server-facing data operations grouped by domain (`sms/`, `mantenimiento/`, `general/`, etc.) |
| `hooks/` | Custom React hooks per domain |
| `stores/` | Zustand stores — `CompanyStore.ts` persists selected company/station to localStorage |
| `contexts/` | `AuthContext.tsx` — authentication state, `useAuth()` hook, login/logout mutations |
| `lib/` | Cross-cutting utilities: `axios.ts`, `session.ts`, `cookie.ts`, `echo.js`, `menu-list.tsx` |
| `providers/` | Root React providers: React Query client, theme |
| `middleware.ts` | Route protection — redirects to `/login` if `auth_token` cookie is absent |

### Data Flow

**Auth:** Login form → `AuthContext.loginMutation` → POST `/login` → `auth_token` cookie + encrypted JWT session (JOSE, 24h, HttpOnly) → redirect to `/inicio`.

**API calls:** All HTTP via `lib/axios.ts` — base URL from `NEXT_PUBLIC_API_BASE_URL`, request interceptor injects `Authorization` header from the `auth_token` cookie.

**Server state:** TanStack React Query for fetching/caching. Mutations follow this pattern:
```typescript
useMutation({
  mutationFn: async (data) => (await axiosInstance.post('/endpoint', data)).data,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] })
    toast.success('...')
  },
  onError: (error) => toast.error('...')
})
```

**Client state:** Zustand `CompanyStore` for selected company/station. Auth state in `AuthContext`.

**Real-time:** Laravel Echo + Pusher.js over WebSocket via `lib/echo.js` (configured with `NEXT_PUBLIC_REVERB_*` env vars).

### Conventions

- **Imports:** Use `@/*` alias, not long relative paths.
- **Naming:** PascalCase for components (`UserForm.tsx`), camelCase for hooks/utilities (`useDebounce.ts`), lowercase-with-hyphens for route folders.
- **Business logic** belongs in `actions/` or `hooks/`, not in page components.
- **Hooks in `actions/`** follow `useCreateX`, `useUpdateX`, `useDeleteX` pattern.
- **Forms:** React Hook Form + Zod schema validation + shadcn form components.
- **Tables:** TanStack React Table with column definitions typed in TypeScript.
- **Formatting:** Prettier — 2-space indent, single quotes, trailing commas, 120-char line width.

### Domains

Business pages are organized under `app/[company]/` by domain:

| Route folder | Domain |
|---|---|
| `almacen/` | Warehouse / inventory |
| `compras/` | Purchasing |
| `mantenimiento/` | MRO maintenance |
| `ingenieria/` | Engineering |
| `planificacion/` | Planning |
| `sms/` | Safety management |
| `gestion_costos/` | Cost management |
| `administracion/` | Administration |
| `ajustes/` | Settings |

Corresponding server operations live in `actions/<domain>/` and hooks in `hooks/<domain>/`.

### Interface Design System

Full spec is in [`.interface-design/system.md`](.interface-design/system.md). Key rules:

**Product domain:** Aviation MRO. Users are warehouse coordinators and purchasing analysts — information density is a feature.

**No drop shadows.** All surfaces defined by borders only: `rounded-lg border bg-background`.

**Typography hierarchy:**
- Body/values: `text-sm font-medium`
- Supporting info: `text-sm text-foreground/80`
- Metadata: `text-xs text-muted-foreground`
- Field labels: `text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`
- Technical data (P/N, order numbers, registrations): `font-mono`

**Status badge color pattern** (`border-*/30 bg-*/10 text-*`):
- Approved → `emerald-500`
- Rejected → `red-500`
- Pending → `amber-500`
- Priority HIGH/AOG → `red-500`

**Target type accent colors:**
- AIRCRAFT → `sky-500`, FLEET → `indigo-500`, WORKSHOP → `orange-500`

**Detail page layout:** `max-w-7xl`, two-column grid — left `lg:col-span-8` (main), right `lg:col-span-4` (sticky documents/side panel).

**Context Strip pattern** — full-width accent band between page header and body, color driven by entity type. Use `TARGET_CONFIG` object pattern to centralize per-variant color decisions.

**Reusable misc components:** `InfoCell` (label + value display, `mono` prop for technical data), `FieldLabel`, `DocPreview` (PDF/image with header bar, fixed `h-[240px]`).

### Environment Variables

Key vars in `.env`:
- `NEXT_PUBLIC_API_BASE_URL` — backend REST API
- `NEXT_PUBLIC_IMAGE_BASE_URL`, `NEXT_PUBLIC_STORAGE_BASE_URL` — file/image storage
- `NEXT_PUBLIC_REVERB_*` — WebSocket (Laravel Reverb) config
- `SECRET_KEY_JWT` — server-side JWT signing key (never expose client-side)

When adding integrations, centralize config in `lib/axios.ts`, `lib/session.ts`, or the relevant `actions/` module — do not duplicate across pages.

## Common Patterns & Solutions

### Loading & Error States

**Standard query loading pattern:**
```typescript
const { data, isLoading, isError } = useGetResource();

return (
  <>
    {isLoading && <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}
    {isError && <Card className="border-red-200"><p className="text-red-600">Error loading resource...</p></Card>}
    {data && <YourComponent data={data} />}
  </>
)
```

**Mutation loading & error:**
```typescript
const mutation = useMutation({
  mutationFn: async (payload) => (await axiosInstance.post('/endpoint', payload)).data,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] })
    toast.success('Success!')
  },
  onError: (error: any) => toast.error(error.response?.data?.message || 'Error occurred')
})

// Use in component:
<Button onClick={() => mutation.mutate(data)} disabled={mutation.isPending}>
  {mutation.isPending ? 'Saving...' : 'Save'}
</Button>
```

### Reusable Component Patterns

**InfoCell** — Display label + value pair (often used in detail pages):
```typescript
// Usage:
<InfoCell label="Part Number" value="ABC-123-XYZ" mono />
<InfoCell label="Status" value="Active" />

// Suggested implementation (in components/misc/InfoCell.tsx):
interface InfoCellProps {
  label: string
  value: string | number | null | undefined
  mono?: boolean
}
export function InfoCell({ label, value, mono }: InfoCellProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium", mono && "font-mono")}>{value || 'N/A'}</p>
    </div>
  )
}
```

**DocPreview** — Display PDF/image with consistent header and sizing (fixed h-[240px]):
```typescript
// Suggested implementation:
<DocPreview 
  title="Document"
  src={url}
  type="pdf" | "image"
  onDownload={handleDownload}
/>
```

**Context Strip** — Full-width accent band below page header, color by entity type:
```typescript
// Pattern: Use a TARGET_CONFIG object to centralize color decisions
const TARGET_CONFIG = {
  AIRCRAFT: { bg: 'bg-sky-50', border: 'border-sky-500', text: 'text-sky-900' },
  FLEET: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-900' },
  WORKSHOP: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-900' }
}

<div className={cn("border-l-4 p-4", TARGET_CONFIG[target].bg, TARGET_CONFIG[target].border)}>
  <p className={cn("text-sm font-medium", TARGET_CONFIG[target].text)}>Context information</p>
</div>
```

**FieldLabel** — Consistent field label styling per design system:
```typescript
<label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
  Field Name
</label>
```

### Role-Based Access Control

Authentication and roles are managed centrally:

**AuthContext:**
- `useAuth()` hook returns `{ user, isAuthenticated, login, logout, roles }`
- `user.roles` array contains role strings (e.g., `['admin', 'purchaser']`)

**Route Protection:**
```typescript
// Wrap page content with ProtectedLayout:
<ProtectedLayout roles={['warehouse_manager', 'admin']}>
  <YourPageContent />
</ProtectedLayout>

// Or conditionally render features:
{user?.roles?.includes('admin') && <AdminPanel />}
```

**Middleware:**
- Checks for `auth_token` cookie presence only
- Redirects missing auth to `/login?from=<current-path>`
- Does NOT check roles — use `ProtectedLayout` for that

### API Type Generation

**Workflow:**
1. Backend OpenAPI spec located at external URL or `/api.json` in backend project
2. Frontend config in `openapi-ts.config.ts`
3. Run: `npm run api:generate`
4. Output: `.gen/api/types.gen.ts` (auto-generated, never edit)
5. Import types: `import { Resource } from '@api/types.gen'`

**When to regenerate:**
- After backend API changes schema
- Before opening PR if using new API endpoints
- If TS compiler complains about type mismatches

## 🚨 Critical Gotchas

**Multi-tenant is mandatory.** Routes must nest under `app/[company]/...` for company selector to work. Root-level routes bypass tenant isolation.

**`'use client'` required for all hooks.** Server components cannot use `useQuery()`, `useCompanyStore()`, or mutation hooks. Add directive at top of file.

**Auth token injected automatically.** Don't manually set Authorization headers in requests — `lib/axios.ts` interceptor handles it from cookie.

**Query invalidation critical.** After mutations, call `queryClient.invalidateQueries({ queryKey: [...] })` or data won't refresh on screen.

**No global error boundary.** Error handling is manual — use try-catch + `toast.error()` or query error states. No centralized Sentry/error logging.

**localStorage persists state.** `CompanyStore` persists to localStorage. Multi-tab workflows may have sync issues. Test carefully.

**ProtectedLayout for role checks.** Middleware only checks auth token. Role-based route access requires wrapping with `<ProtectedLayout roles={[...]} />`.

**OpenAPI types auto-generated.** Never edit `.gen/api/types.gen.ts` by hand. Run `npm run api:generate` to regenerate from backend spec.

**Prettier format enforced.** ESLint includes formatting rules. Run `npm run lint -- --fix` before commits to auto-format.
