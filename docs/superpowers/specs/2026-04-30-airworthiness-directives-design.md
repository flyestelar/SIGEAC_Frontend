# Airworthiness Directives Design

## Context

This document defines the frontend design for the `Directivas de Aeronavegabilidad` section inside the `Planificación` module.

The UI must adapt to the following entity model:

- `Airworthiness_Directive`
- `AD_Applicability`
- `AD_Compliance_Control`
- `AD_Compliance_Record`

For the first visible version, the scope is limited to aircraft applicability. The data model remains compatible with future component applicability.

## Design Goals

- Keep the AD as the root entity visible to the user.
- Preserve regulatory traceability and document context.
- Support full CRUD for the section, not just read-only review.
- Make compliance control the dominant operational workflow.
- Keep execution history auditable and hard to alter.
- Prepare the UI structure for later extension to components without redesigning the information architecture.

## Confirmed Product Decisions

- Primary entry model: `Directiva primero`.
- First visible scope: `Sólo aeronave por ahora`.
- Dominant task in detail: `Control de cumplimiento`.
- Interaction scope: `CRUD completo`.
- Recurrent compliance behavior: `Auto-regenerar próximo vencimiento`.
- Recommended product posture: `Gestor operativo balanceado`.
- Detail layout: tabs.

## Information Architecture

The section is split into two levels:

1. `Directives index`
2. `Directive detail`

### Directives Index

The index is a master table where each row represents one `Airworthiness_Directive`.

The row must combine document identity and operational status:

- `ad_number`
- `authority`
- `subject_description` summary
- `issue_date`
- `effective_date`
- `is_recurring`
- PDF availability
- applicable aircraft count
- open controls count
- upcoming due count
- overdue count
- latest execution indicator

The index must support:

- create directive
- search by AD number, authority, subject
- filter by recurrence, authority, and aggregated operational status
- quick access to PDF
- navigation to detail
- edit directive
- delete or deactivate directive according to backend constraints

For index filtering, `aggregated operational status` means the rolled-up condition of the directive across its aircraft controls, for example: `Sin configurar`, `Al día`, `Próxima`, or `Vencida`.

### Directive Detail

The detail page keeps the document identity at the top and organizes the rest of the workflow with tabs.

Header content:

- AD number
- authority
- subject description
- issue date
- effective date
- recurring badge
- PDF action
- primary actions such as edit and delete/deactivate

Tabs:

- `Resumen`
- `Aplicabilidad`
- `Control`
- `Ejecuciones`

`Control` is the dominant operational tab.

## Tab Design

### Resumen

Purpose: show the directive as a regulatory record plus operational summary.

Content:

- all main fields from `Airworthiness_Directive`
- total aircraft evaluated
- total applicable aircraft
- total non-applicable aircraft
- total open controls
- total closed controls
- total recurrent controls
- upcoming due summary
- overdue summary

Primary actions:

- edit directive
- open PDF
- delete or deactivate directive

### Aplicabilidad

Purpose: manage `AD_Applicability` records for aircraft.

Table columns:

- aircraft
- applicability flag
- non-applicability reason
- AMOC approved method
- configuration status

Primary actions:

- add applicability
- edit applicability
- mark non-applicable
- register or edit AMOC
- remove applicability only if there is no dependent control or execution history

Business rule:

If an aircraft is marked as `is_applicable = false`, it remains visible for audit purposes but is excluded from the operational flow in `Control`.

### Control

Purpose: operate `AD_Compliance_Control` as the main working surface.

Each row represents one applicable aircraft in operational context. If the aircraft already has an active control, the row shows that control. If it has applicability but no control yet, the row still appears with `Pendiente de configurar` status.

Table columns:

- aircraft
- calendar due date
- flight hours due
- cycles due
- recurrence interval days
- recurrence interval hours
- recurrence interval cycles
- compliance status
- urgency state

Urgency states shown in UI:

- `Al día`
- `Próximo`
- `Vencido`
- `Pendiente de configurar`

Primary actions:

- create control
- edit control
- register compliance
- close control manually when permitted

Recurring rule:

When the user registers a compliance for a recurrent AD, the current control is logically closed as recurrent and the next due threshold is recalculated automatically.

### Ejecuciones

Purpose: expose immutable historical execution records from `AD_Compliance_Record`.

Table columns:

- aircraft
- work order number
- execution date
- flight hours at execution
- cycles at execution
- inspector license signature
- remarks

Primary actions:

- register execution
- filter history
- sort by execution date

The normal visible workflow allows creation of execution records, but not ordinary editing or deletion.

## Navigation and State Rules

Tabs are freely navigable, but business rules constrain the actions available inside them.

- `Resumen` is always available.
- `Aplicabilidad` is the entry point for aircraft-level operational setup.
- `Control` can only create controls for aircraft with `is_applicable = true`.
- `Ejecuciones` can always be viewed, but new execution records require a valid applicability and associated control.

Operational rules:

- non-applicable aircraft are visible in `Aplicabilidad`, excluded from `Control`
- applicability without control appears as `Pendiente de configurar`
- open control before due threshold appears as `Al día`
- control near threshold appears as `Próximo`
- control past threshold appears as `Vencido`
- non-recurrent compliance closes the control as `Cerrado`
- recurrent compliance closes the current cycle as `Cerrado-Recurrente` and recalculates the next active due threshold

## CRUD Rules

### Airworthiness_Directive

Visible scope:

- create
- read
- update
- delete or deactivate

Restriction:

If the directive already has downstream records, physical deletion should be restricted and replaced by logical deactivation if supported by the backend.

### AD_Applicability

Visible scope:

- create
- read
- update
- restricted delete

Restriction:

A record can only be removed when there is no dependent control and no execution history.

### AD_Compliance_Control

Visible scope:

- create
- read
- update
- restricted delete

Restriction:

Controls should not be removed through normal flow if execution history already exists.

### AD_Compliance_Record

Visible scope:

- create
- read

Restriction:

Edition and deletion should be reserved for high-privilege workflows or excluded from the first visible version.

## Validations

- `AD_Applicability` cannot be duplicated for the same `ad_id + aircraft_id`.
- `non_applicability_reason` is required when `is_applicable = false`.
- `AD_Compliance_Control` requires a valid applicable aircraft record.
- a control cannot be saved with all due thresholds and recurrence fields empty.
- `execution_date`, `work_order_number`, and `inspector_license_signature` are required for each execution record.
- execution registration must validate consistency against the active control before persistence.

## Error Handling

- index load failure must show a recoverable page-level error state with retry
- tab action failures must remain local to the tab, inline block, or modal
- if there are no applicability records, `Aplicabilidad` shows an actionable empty state
- if there are applicability records but none are applicable, `Control` shows an explanatory empty state
- if there is no execution history, `Ejecuciones` shows an empty history state instead of an error

## Permissions

- planning users with operational permissions can create and edit directives, applicability, and controls
- execution history creation is allowed in normal operational flow
- execution history alteration or deletion requires elevated privileges or stays outside first-version UI scope
- sensitive actions require explicit confirmation, especially directive deletion, applicability removal, and manual control closure

## UX Notes

- The section should feel denser and more operational than the current extraction-oriented prototype.
- The AD must remain recognizable as the legal parent document even in the operational workflow.
- The main list should surface operational signals without becoming a pure task inbox.
- Detail tabs should reduce visual overload while keeping business progression clear.
- The design must preserve the existing product language used in the planning module: bordered surfaces, compact data density, strong status signaling, and technical typography for identifiers.

## Out of Scope for First Visible Version

- component-level applicability as a primary visible path
- mass compliance actions
- advanced audit correction flows for execution history
- specialized analytics dashboards beyond summary indicators in the main index and detail

## Acceptance Checks

- create a new directive and edit the base data
- register aircraft applicability including `no aplica` cases
- create controls with date, flight-hours, and cycle-based thresholds
- register a non-recurrent compliance and verify closure
- register a recurrent compliance and verify automatic next due recalculation
- verify that non-applicable aircraft never appear as active work items in `Control`
- verify that execution history remains visible, ordered, and traceable

## Recommended Implementation Shape

The frontend should be implemented as:

- one index route for directives
- one detail route for a single directive
- separate tab-scoped components for `Resumen`, `Aplicabilidad`, `Control`, and `Ejecuciones`
- modal or sheet forms for create/edit operations
- shared status helpers for due-state calculation and badge rendering

This keeps each entity workflow isolated while preserving the directive as the navigation root.
