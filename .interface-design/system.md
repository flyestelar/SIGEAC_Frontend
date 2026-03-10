# SIGEAC Frontend — Interface Design System

## Direction & Feel

**Product domain:** Aviation MRO (Maintenance, Repair & Overhaul). Users are warehouse coordinators and purchasing analysts working in a technical, professional context adjacent to aircraft hangars. Information density is a feature — not a problem.

**Feel:** Technical documentation aesthetic. Cool-blue, precise, no decorative noise. Think AMOS or SAP MRO interfaces — not a consumer app.

---

## Depth Strategy

**Borders-only.** No drop shadows anywhere. Surfaces are defined exclusively by borders.

- Standard containers: `rounded-lg border bg-background`
- Inset sections / batch headers: `bg-muted/20` background tint, no extra border
- Document previews: `rounded-md border bg-background`
- Icon containers: `rounded border bg-muted/30`

---

## Spacing

Base unit: `4` (1rem / 16px). All spacing in multiples.

- Component padding: `px-5 py-3` (sections), `p-5` (content areas), `p-4` (tighter panels)
- Grid gaps: `gap-4` (layout), `gap-3` (component clusters), `gap-x-6 gap-y-4` (info grids)
- Stack spacing: `space-y-4` (major sections), `space-y-3` (component lists), `space-y-1.5` (field internals)

---

## Typography

Four-level hierarchy:

| Level | Usage | Classes |
|---|---|---|
| Primary | Body text, values | `text-sm font-medium` |
| Secondary | Supporting info, descriptions | `text-sm text-foreground/80` |
| Tertiary | Metadata, emails | `text-xs text-muted-foreground` |
| Labels | Field labels | `text-[11px] font-semibold uppercase tracking-widest text-muted-foreground` |

**Monospace** for all technical data: P/N, order numbers, aircraft registrations — `font-mono`.

The `FieldLabel` / `InfoCell` components encapsulate these patterns and should be reused across detail pages.

---

## Color Tokens

Semantic status colors (border/bg/text pattern):

```
Approved:  border-emerald-500/30  bg-emerald-500/10  text-emerald-600 dark:text-emerald-400
Rejected:  border-red-500/30      bg-red-500/10      text-red-600     dark:text-red-400
Pending:   border-amber-500/30    bg-amber-500/10    text-amber-600   dark:text-amber-400
Priority HIGH/AOG: border-red-500/30  bg-red-500/10  text-red-600
Priority MED/LOW:  border-amber-500/30 bg-amber-500/10 text-amber-600
```

Requisition target accent colors:

```
AIRCRAFT:  sky-500    strip: bg-sky-50 dark:bg-sky-950/20      border-sky-200 dark:border-sky-800/40
FLEET:     indigo-500 strip: bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40
WORKSHOP:  orange-500 strip: bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/40
```

---

## Signature Pattern: Context Strip

Used on detail pages where the subject entity (aircraft, fleet, workshop) determines the page context.

A full-width band between the page header's top bar and the body. Its background color changes based on the entity type, setting the accent for the entire page.

```tsx
<div className={cn('flex items-center gap-3 border-t px-5 py-2.5', tCfg.stripBg, tCfg.stripBorder)}>
  <div className={cn('flex h-6 w-6 items-center justify-center rounded border', tCfg.iconBg, tCfg.iconBorder)}>
    <TargetIcon className={cn('h-3 w-3', tCfg.iconText)} />
  </div>
  <span className={cn('text-[11px] font-bold uppercase tracking-widest', tCfg.accentText)}>
    {tCfg.label}
  </span>
  {/* · entity name */}
</div>
```

The strip config object pattern (TARGET_CONFIG) is the recommended way to handle multi-variant entity types. Centralizes all color decisions per variant.

---

## Key Components

### InfoCell
Reusable field display with label + value. `mono` prop for technical data.
Located inline in detail pages — extract to `components/misc/InfoCell.tsx` if used 3+ times.

### DocPreview
Renders PDF (iframe) or image (next/image) with a consistent header bar showing filename, type badge, and external link button. Fixed height `h-[240px]`.

### FieldLabel
`text-[11px] font-semibold uppercase tracking-widest text-muted-foreground` — the consistent section/field label style used throughout.

---

## Layout Patterns

**Detail page layout:**
- Max width: `max-w-7xl`
- Two-column body: left `lg:col-span-8` (main content), right `lg:col-span-4` (documents/side panel, `lg:sticky lg:top-4`)
- Header card above the grid, full width

**Section within left column:**
```
rounded-lg border bg-background
  └── border-b px-5 py-3        ← section label bar
  └── space-y-5 p-5             ← content
      └── grid cols + Separator between logical groups
```

**Batch/list item container:**
```
overflow-hidden rounded-lg border bg-background
  └── border-b bg-muted/20 px-5 py-3   ← item header
  └── divide-y                          ← items separated by dividers
      └── p-5                           ← each item
```
