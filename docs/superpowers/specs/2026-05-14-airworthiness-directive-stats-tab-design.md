# Airworthiness Directive Stats Tab Design

## Context

This document defines the frontend design for a new `Estadísticas` tab inside the airworthiness directive detail page:

- `app/[company]/planificacion/directivas/[id]/page.tsx`

The current page already exposes:

- directive identity and summary counters
- applicability records
- compliance controls
- compliance execution records

This iteration adds a visual analytics layer on top of that existing data. The goal is to improve operational readability without introducing a backend dependency or changing the existing workflow structure.

## Design Goals

- Add a new tab that feels like a compact operational dashboard, not a detached report.
- Keep the experience useful for quick decision-making and visually richer than the current summary tab.
- Reuse the queries already consumed by the detail page.
- Avoid introducing new server contracts in this iteration.
- Preserve the current detail page as the source of truth for editing and execution actions.

## Confirmed Product Decisions

- Tab type: `Mixto`
- Density level: `Balanceado`
- Data posture: `Derived from current detail data`
- First iteration scope: `Frontend only`

## Scope

The new tab will be added to the existing tabs list as:

- `Estadísticas`

The tab will combine:

- top-level KPIs
- visual distribution charts
- aircraft-level ranking
- short operational insights

The tab will not include:

- new forms
- inline mutations
- advanced time-range filtering
- backend-specific historical endpoints

## Information Architecture

The new tab sits alongside:

- `Resumen`
- `Aplicabilidad`
- `Control`
- `Ejecuciones`

Its role is interpretive, not transactional.

Users should be able to understand the directive's operational condition in one pass, then move to `Control` or `Ejecuciones` to act.

## Data Sources

The tab will derive its content from data already available in the page:

- `directive.summary`
- `applicabilities`
- `controls`
- `records`

No additional fetch will be required for the first iteration.

Known limitation:

- the execution charting layer reflects the records currently returned by the existing records query, not a dedicated full historical dataset

This is acceptable for the first version because the goal is better detail-page readability, not a certified analytics module.

## Tab Layout

### 1. KPI Strip

The top row should present compact cards with immediate operational signals.

Recommended cards:

- `Cobertura`
  Shows applicable aircraft versus evaluated aircraft.
- `Cumplimiento`
  Shows closed controls versus total controls.
- `Riesgo inmediato`
  Shows overdue plus upcoming controls.
- `Actividad`
  Shows total execution records currently visible.

These cards should visually match the existing detail header language while feeling slightly more dashboard-oriented.

### 2. Main Charts Grid

The central area should use a responsive grid with three visual blocks.

#### Applicability Breakdown

Chart type:

- donut or pie chart

Data:

- applicable aircraft
- non-applicable aircraft
- pending configuration

Purpose:

- show fleet coverage shape at a glance

#### Control Status Breakdown

Chart type:

- bar chart

Data:

- open controls
- closed controls
- recurrent controls
- upcoming due count
- overdue count

Purpose:

- expose operational pressure and compliance distribution

#### Executions by Aircraft

Chart type:

- horizontal or vertical bar chart

Data:

- grouped execution count by aircraft acronym

Purpose:

- show where execution activity is concentrated

If there are no execution records, this block should fall back to a clear empty state rather than an empty chart shell.

### 3. Operational Reading Block

The bottom area should include two support cards.

#### Risk Snapshot

This card shows compact metric chips or mini-stat blocks for:

- open controls
- overdue controls
- upcoming controls
- aircraft with applicability

Purpose:

- give a second fast reading path without requiring chart interpretation

#### Insights

This card generates 3 to 4 short textual observations derived from the dataset, for example:

- most controls are still open
- there are overdue items requiring attention
- execution activity is concentrated in a small subset of aircraft
- the directive has limited or broad applicability across the fleet

These insights must remain deterministic and data-derived. No decorative placeholder copy.

## Responsive Behavior

- On desktop, the tab should render as a multi-column dashboard.
- On tablet, the charts should stack into a two-column then one-column flow as space shrinks.
- On mobile, all cards and charts should become a single-column reading experience.

Charts must remain legible without forcing horizontal scroll.

## Visual Direction

The tab should stay inside the current planning UI language:

- bordered cards
- muted backgrounds
- semantic status colors
- uppercase utility labels

It should feel more elevated than the plain summary tab through:

- stronger grouping
- deliberate chart color usage
- better information rhythm

It should not become overly decorative or look disconnected from the rest of the module.

## Component Strategy

The implementation should favor small local helpers or extracted presentational blocks for:

- KPI cards
- empty chart state
- insight generation
- chart sections

If the page file becomes too large, the statistics UI should be extracted into a colocated component under the directive route or a planning component folder.

## Error Handling and Empty States

- If base page data is missing, the page-level error behavior remains unchanged.
- If charts have insufficient data, show explicit empty states with useful text.
- Avoid rendering misleading zero-heavy charts when the real state is “no records available”.

## Testing and Verification

Minimum verification for implementation:

- `npm run lint`
- `npm run build`

Manual verification should confirm:

- new tab appears in the existing tab bar
- charts render correctly with real data
- layout remains stable on desktop and mobile widths
- empty states behave correctly when records or controls are absent
- no existing tab behavior regresses

## Out of Scope

- historical filtering by date range
- export actions
- aircraft drill-down from charts
- backend analytics endpoints
- replacing the current `Resumen` tab

## Recommendation

Implement the new `Estadísticas` tab as a balanced operational dashboard driven by the current detail queries. This gives the directive detail page a stronger command-center feel while keeping scope tight, low-risk, and compatible with the current API layer.
