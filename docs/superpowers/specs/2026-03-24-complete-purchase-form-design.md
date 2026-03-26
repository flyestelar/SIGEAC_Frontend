# CompletePurchaseForm Redesign

## Context

`components/forms/mantenimiento/compras/CompletePurchaseForm.tsx` currently handles payment, shipping, tracking, invoice upload, and per-article fields in a single flow. The new requirement is to rebuild it from zero as a compact purchase-order completion form.

The form should only:

- display the purchase order articles as read-only context
- capture a monetary field named `fright`
- capture an optional monetary field named `hazmat`
- submit the purchase-order articles plus those two amounts

The form should reuse `AmountInput` and stay aligned with the existing MRO purchasing UI system: technical, compact, border-based, and operationally clear.

## User Intent

The user is a purchasing or warehouse operator closing an existing purchase order. They do not need to edit article details here. They only need to verify the order contents, enter final logistics costs, and confirm completion with minimal friction.

The screen should feel:

- technical
- compact
- low-noise
- trustworthy for operational review

## Chosen Direction

Selected approach: summary first, costs at the end.

Why:

- it reflects the actual workflow: verify the PO, then add closing amounts
- it removes unused fields and reduces cognitive load
- it fits the established layout style used in the purchases module

Rejected alternatives:

- costs-first layout: faster for expert users but weaker for order verification
- two-column sticky summary: useful for larger workflows, unnecessary for this compact form

## Interface Structure

The form will be a single bordered container with three vertical sections.

### 1. Order Context Header

Purpose: confirm the user is completing the correct PO before interacting with costs.

Content:

- PO identifier if available from `po`
- article count
- current subtotal

Presentation:

- bordered header strip or top card section
- compact metadata style
- monetary values visually emphasized without introducing decorative color

### 2. Read-Only Article List

Purpose: provide quick validation of what belongs to the PO.

Content per row:

- part number
- quantity
- optional supporting description/value if present on the article model

Behavior:

- no editable controls
- scrollable only if the number of articles makes the block too tall
- each row separated with subtle borders or dividers

### 3. Cost Capture and Total

Purpose: capture the only mutable values required to complete the PO.

Fields:

- `fright` using `AmountInput`
- `hazmat` using `AmountInput`, optional

Computed display:

- subtotal
- total = `po.sub_total + fright + hazmat`

Actions:

- primary submit button for completion
- secondary close/cancel action only if the current modal pattern requires it

## Data Model

The form schema is intentionally minimal:

```ts
{
  fright: string;
  hazmat?: string;
  articles_purchase_orders: Array<{
    article_purchase_order_id: number;
    article_part_number: string;
  }>;
}
```

Notes:

- `articles_purchase_orders` is derived directly from `po.article_purchase_order`
- no per-article editing fields are included
- `hazmat` remains optional at the form level

## Submission Behavior

On submit:

1. Normalize `fright` to a monetary string, defaulting empty input to `0`.
2. Normalize `hazmat` the same way, even though it is optional.
3. Map `po.article_purchase_order` into the minimal payload required by the completion action.
4. Recompute total from subtotal + `fright` + `hazmat`.
5. Send only the reduced payload plus the existing company/user metadata required by the action.

Fields removed from the previous implementation:

- tax
- wire fee
- handling fee
- shipping split by location
- payment method
- bank account / card
- invoice upload
- tracking numbers
- article location

## Error Handling

- standard form validation messaging for invalid monetary input
- disabled submit state while mutation is in flight
- no extra validation is required on read-only article rows

## Testing and Verification

Minimum verification after implementation:

- `npm run lint`
- manual check of the purchase-order completion flow in the relevant compras route

Manual UI checks:

- articles render correctly in read-only mode
- `fright` updates total immediately
- `hazmat` updates total immediately when present
- empty `hazmat` still submits successfully
- final payload excludes removed legacy fields

## Implementation Notes

- reuse `AmountInput`
- prefer the existing form primitives from `components/ui/form`
- keep the border-only depth strategy from the local interface design system
- avoid introducing a denser two-column structure unless the existing modal width forces it
