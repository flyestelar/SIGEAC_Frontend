# PO List SubRow + Detail Page Redesign

**Date:** 2026-03-24
**Status:** Approved
**Scope:** `app/[company]/compras/ordenes_compra/`

---

## Context

The Purchase Orders screen currently has two problems:
1. The list table has no `data-table.tsx` (missing file — build error) and shows article count as plain text with no way to preview articles inline.
2. The detail page (`[order_number]/page.tsx`) is a rough draft: wrong title, centered card layout, no proper information hierarchy, broken delete button (no `onClick`), status check inconsistency (`'pagado'` vs `'PAGADO'`).

---

## Design

### 1. PO List — Expandable SubRow

**File to create:** `app/[company]/compras/ordenes_compra/data-table.tsx`

A dedicated data table component for purchase orders. Uses TanStack's `getExpandedRowModel` to support row expansion inline.

**Expand trigger:** A `ChevronRight` icon column (first column, ~40px width). The icon rotates 90° when the row is expanded. Clicking it toggles expansion.

**SubRow content:** A franja below the parent row with `bg-muted/20` background (no shadow, borders-only per system.md). Contains:

- A header bar: `text-[11px] font-semibold uppercase tracking-widest text-muted-foreground` label "Artículos"
- A compact article table with columns:
  | Column | Notes |
  |--------|-------|
  | Batch | `text-muted-foreground` |
  | Part Number | `font-mono font-medium` |
  | ALT P/N | `font-mono text-muted-foreground`, shows `—` if absent |
  | Qty | centered |
  | Unit Price | right-aligned, formatted as USD |
  | Total | `qty × unit_price`, right-aligned, formatted as USD |
- A subtotal row at the bottom, separated by `border-t`, right-aligned with `font-semibold`

**Columns change:** The "Artículos" column in the parent row changes from `"Total de X artículo(s)"` text to a small outline badge `X art.`

---

### 2. PO Detail Page Redesign

**File to rewrite:** `app/[company]/compras/ordenes_compra/[order_number]/page.tsx`

Follows the two-column layout pattern from system.md.

#### Header (full width)
- Back button (ArrowLeft) → `/[company]/compras/ordenes_compra`
- PO number in `font-mono` with status badge (amber = PROCESO, green = PAGADO)
- Status check normalized: `status?.toUpperCase() === 'PAGADO'`

#### Left column — `lg:col-span-8`

**Sección: Información General**
Four InfoCell fields in a grid: PO number, Quote number, purchase date, created by.

**Sección: Proveedor**
Vendor name (and any available contact info).

**Sección: Artículos**
A proper table (not cards) with columns: Batch, Part Number, ALT P/N, Qty, Unit Price, Total.
- Part numbers in `font-mono`
- Subtotal row at bottom, `border-t`, right-aligned

#### Right column — `lg:col-span-4 lg:sticky lg:top-4`

**Sección: Acciones** *(visible only when `status?.toUpperCase() === 'PROCESO'`)*
- "Completar PO" button → opens `CompletePurchaseForm` dialog
- "Eliminar" button (destructive) → opens delete confirmation dialog wired to `useDeletePurchaseOrder` hook (to be created in `actions/mantenimiento/compras/ordenes_compras/actions.ts` as `DELETE /{company}/delete-purchase-order/{id}`)

**Sección: Costos**
- Subtotal, Freight (`data.freight`), Hazmat (`data.hazmat`) — show `$0.00` if zero/null
- Total highlighted (larger, `font-semibold`)
- Note: `PurchaseOrder` type must be updated to include `freight?: number` and `hazmat?: number` (fields stored by the API after `useCompletePurchase`)

**Sección: Pago** *(only if bank_account or card exists on the PO)*
- Bank name + account name + account number
- Card name + number (if present)

**Sección: Invoice** *(only if `data.invoice` exists)*
- Download/view button
- Note: `PurchaseOrder` type must be updated to include `invoice?: string` (URL returned by API after upload)

---

## Bugs Fixed Along the Way

| Bug | Fix |
|-----|-----|
| Missing `data-table.tsx` | Created as new file |
| `if (isLoading) { <LoadingPage /> }` without `return` in `page.tsx` | Add `return` |
| Status check `'pagado'` (lowercase) vs `'PAGADO'` | Normalize with `.toUpperCase()` |
| Wrong page title "Cotización" | Changed to "Orden de Compra" |
| Delete button has no `onClick` | Wire to mutation |
| Hardcoded `/estelar/` slug in `columns.tsx` link | Use dynamic `[company]` param from `useParams` or pass as prop |
| `ContentLayout title='Cotizaciones'` in list page | Changed to "Órdenes de Compra" |

---

## Files Changed

| File | Action |
|------|--------|
| `app/[company]/compras/ordenes_compra/data-table.tsx` | Create (does not exist — build error today) |
| `app/[company]/compras/ordenes_compra/columns.tsx` | Modify (chevron col, badge, fix slug) |
| `app/[company]/compras/ordenes_compra/page.tsx` | Modify (fix loading return, title) |
| `app/[company]/compras/ordenes_compra/[order_number]/page.tsx` | Rewrite |
| `actions/mantenimiento/compras/ordenes_compras/actions.ts` | Add `useDeletePurchaseOrder` hook |
| `types/index.ts` | Add `freight?: number`, `hazmat?: number`, `invoice?: string` to `PurchaseOrder` type |

---

## Constraints

- Depth strategy: borders-only (no shadows)
- Typography: FieldLabel pattern for section headers, `font-mono` for all technical data
- No new dependencies — uses existing TanStack, shadcn/ui, lucide-react
- `CompletePurchaseForm` already exists and works — used as-is from the right column
