# Hard Time Warehouse Install Modal Design

Date: 2026-04-22

## Goal

Improve Hard Time component installation so a planner can mount a component either:

- manually, by typing component identity and current usage values
- from warehouse inventory, by selecting one serialized component from a mini table

This work must keep a single install modal, make the difference between both sources obvious, and preserve the current backend contract where warehouse-backed installs update inventory state and quantities server-side.

## User and context

Primary user: planning or maintenance control staff working on an aircraft slot that needs a component installed.

User intent:

- understand which slot is being filled
- decide whether the source is manual or warehouse
- if warehouse-backed, find and select one serialized component quickly
- confirm or correct FH/FC before installing

The interface should feel like technical workflow software: dense, precise, calm, and operational.

## Scope

In scope:

- redesign `InstallComponentDialog`
- support two clear install sources inside one modal: `Manual` and `Desde almacén`
- add warehouse item selection UI as a mini table inside the modal
- prefill install form from the selected warehouse row
- keep FH/FC editable even when prefilling from warehouse
- default null FH/FC values from warehouse to `0`
- send `article_id` for warehouse-backed installs

Out of scope:

- part-number compatibility filtering or validation
- multi-select or quantity-based picking
- non-serialized component install flow
- redesign of uninstall or compliance flows
- changes to backend inventory side effects

## Confirmed requirements

- single modal, not separate screens
- manual and warehouse modes must be visually distinct
- warehouse mode opens directly with a table, no warehouse selector step
- warehouse selection is single-choice
- any part number can be selected for now
- warehouse values may prefill serial, P/N, FH, FC
- if FH/FC from warehouse are null, frontend initializes them as `0`
- FH/FC remain editable before submit
- backend already handles warehouse inventory state and quantities on install

## UX direction

### Modal structure

Use one modal with three vertical zones:

1. Context header
2. Source workbench
3. Shared confirmation footer

### 1. Context header

The top of the modal should anchor the operation with slot context:

- slot position
- batch/component name expected for the slot
- aircraft FH and FC at the moment of install

This is read-only context and should remain visible regardless of source mode.

### 2. Source workbench

Below the header, render a strong source selector using a horizontal source rail rather than generic tabs.

Modes:

- `Manual`
- `Desde almacén`

Each mode block should include:

- icon
- title
- one-line explanation

The active mode should use stronger border and background emphasis so the user immediately understands which source is driving the install.

### 3. Shared confirmation area

Below the source-specific area, render a shared install confirmation section. This section contains the final values that will be submitted:

- serial number
- part number
- install date
- component FH at install
- component FC at install

This section is shared by both modes to reinforce that both sources feed the same installation action.

## Mode behavior

### Manual mode

Manual mode is the fallback free-entry path.

Fields:

- serial number
- part number
- install date
- component FH at install
- component FC at install

Behavior:

- `article_id` is empty
- payload marks manual source via existing backend flag
- user enters everything directly

### Warehouse mode

Warehouse mode is the preferred operational path.

Top of section:

- search field
- mini table of available serialized components

Each row should show at least:

- serial
- part number
- batch/component name if available
- current FH
- current FC

Optional secondary metadata can be added later if available, but the first version should stay compact and decision-oriented.

Behavior:

- table loads immediately when entering warehouse mode
- user selects exactly one row
- selected row populates shared confirmation fields
- `article_id` is stored from the selected row
- FH/FC null values are normalized to `0`
- serial and part number also prefill from the selected row
- all prefilled fields remain editable before submission

## State management

Keep separate draft state per source to avoid destructive switching.

Recommended state model:

- `sourceMode`: `'manual' | 'warehouse'`
- `manualDraft`
- `warehouseSelection`
- `warehouseDraft`
- derived `submitPayload`

Behavior:

- switching from manual to warehouse should preserve manual inputs
- switching back from warehouse to manual should restore previous manual draft
- warehouse draft updates when a row is selected
- shared confirmation section renders current source draft

## Validation

Shared required validation:

- serial number required
- part number required
- install date required
- component FH numeric
- component FC numeric

Warehouse-only validation:

- a row must be selected

Normalization:

- null or missing FH/FC from warehouse become `0`

## Data flow

### Read path

Frontend must fetch warehouse-backed serialized components for the modal table.

Minimum row shape needed by the UI:

- `article_id`
- `serial`
- `part_number`
- `batch_name` or equivalent display name
- `component_hours` or equivalent
- `component_cycles` or equivalent
- any optional status or descriptive field if already available

### Submit path

Install submission continues using the existing install mutation and endpoint.

Manual payload:

- `serial_number`
- `part_number`
- `installed_at`
- `component_hours_at_install`
- `component_cycles_at_install`
- no `article_id`
- `is_manual_entry = true`

Warehouse payload:

- `serial_number`
- `part_number`
- `installed_at`
- `component_hours_at_install`
- `component_cycles_at_install`
- `article_id`
- `is_manual_entry = false`

Backend remains responsible for inventory effects.

## Empty, loading, and error states

Warehouse loading:

- show compact skeleton rows in the mini table

Warehouse empty:

- show explicit empty state inside warehouse section
- keep source rail visible
- suggest using manual mode if no serialized components are available

Warehouse fetch error:

- show inline alert in the warehouse section
- do not block switching to manual mode

## Suggested component breakdown

Keep implementation isolated and readable by splitting responsibilities:

- `InstallComponentDialog`
  - modal shell, source mode, shared submit
- `InstallSourceRail`
  - source selector UI
- `WarehouseInstallTable`
  - search + row selection + loading/empty/error states
- `InstallConfirmationFields`
  - shared editable confirmation fields

If the dialog remains small enough, `InstallSourceRail` and `InstallConfirmationFields` can stay local to the file initially, but the warehouse table should be extracted once it carries search and selection logic.

## Existing code impact

Primary file:

- `app/[company]/planificacion/hard_time/_components/install-component-dialog.tsx`

Likely supporting changes:

- add or connect a warehouse query hook for serialized components
- possibly extend types for warehouse row shape
- keep `hardTimeInstallationInstall` mutation usage intact

No change should be required to:

- hard time detail view
- hard time cards
- uninstall flow

## Risks

### Ambiguous mode switching

If both source modes edit the same raw form state, users can lose context or overwrite values accidentally.

Mitigation:

- maintain separate drafts per source

### Modal becoming visually noisy

Adding a table inside a modal can make the flow feel like two unrelated screens.

Mitigation:

- keep strong source rail
- keep shared confirmation section visually consistent
- avoid unnecessary secondary cards

### Warehouse data incompleteness

Serialized items may not always include FH/FC.

Mitigation:

- normalize to `0`
- keep fields editable

## Testing plan

Manual checks required:

1. Open install modal for empty slot and confirm source rail is clear.
2. Switch between `Manual` and `Desde almacén` and verify each source preserves its own draft.
3. Select a warehouse row and verify serial, P/N, FH, and FC populate correctly.
4. Verify null FH/FC become `0`.
5. Edit prefilled FH/FC and submit successfully.
6. Confirm manual mode still submits correctly without `article_id`.
7. Confirm warehouse mode submits with `article_id`.
8. Verify empty, loading, and error states in warehouse mode.

## Recommendation

Implement warehouse install as a focused upgrade to the existing install modal instead of building a separate warehouse picker screen. This preserves current mental model, keeps backend integration simple, and creates a clearer operational workflow for planners.
