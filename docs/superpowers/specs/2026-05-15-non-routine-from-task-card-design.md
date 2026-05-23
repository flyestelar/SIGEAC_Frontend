# Design: Crear No Rutinaria desde TaskCard

**Fecha:** 2026-05-15  
**Estado:** Aprobado

## Objetivo

Permitir que el usuario inicie la creación de una no rutinaria directamente desde el card de una tarea rutinaria en `RoutineTasksList`, sin necesidad de abrir primero el `TaskDetailsDialog`. También corregir el bug donde el tab "No Rutinarias" en `WorkOrderTasksDetails` es inaccesible.

## Alcance

Tres archivos modificados, cero archivos nuevos, cero nuevos endpoints.

## Endpoints involucrados

- `POST /{company}/non-routine` — ya implementado en `useCreateNoRutine` (actions.ts)
- `PUT /{company}/no-routine-task/{id}` — no se toca en este feature

## Cambios por componente

### 1. `TaskCard.tsx`

**Prop nueva (opcional):**
```ts
onCreateNonRoutine?: () => void
```

**Lógica de visibilidad del botón:**
- Mostrar solo cuando: `!isNonRoutine && !task.non_routine && task.status === "ABIERTO"`
- Si `onCreateNonRoutine` no se pasa, el botón no se renderiza (compatible con uso existente en `NoRoutineTasksList`)

**Comportamiento del botón:**
- Texto: "Generar No Rutinaria"
- `variant="outline"` con ícono `Plus`
- Llama `e.stopPropagation()` para no disparar el `onClick` del card
- Luego llama `onCreateNonRoutine()`

### 2. `RoutineTasksList.tsx`

**Estados nuevos:**
```ts
const [nonRoutineTargetId, setNonRoutineTargetId] = useState<string | null>(null)
const [isNonRoutineDialogOpen, setIsNonRoutineDialogOpen] = useState(false)
```

**Cambio en el map de `TaskCard`:**
```tsx
<TaskCard
  ...
  onCreateNonRoutine={() => {
    setNonRoutineTargetId(task.id.toString())
    setIsNonRoutineDialogOpen(true)
  }}
/>
```

**Dialog al final del return:**
```tsx
{nonRoutineTargetId && (
  <CreateNoRutineDialog
    task_id={nonRoutineTargetId}
    open={isNonRoutineDialogOpen}
    onOpenChange={(open) => {
      setIsNonRoutineDialogOpen(open)
      if (!open) setNonRoutineTargetId(null)
    }}
  />
)}
```

> Nota: `CreateNoRutineDialog` actualmente maneja su propio estado `open` internamente con `DialogTrigger`. Hay que refactorizarlo para aceptar props `open` y `onOpenChange` controladas externamente, eliminando el `DialogTrigger`.

### 3. `WorkOrderTasksDetails.tsx` — Bug fix

**Problema:** El tab `value="norut"` no tiene `<TabsTrigger>` asociado, haciendo `NonRoutineTasksList` inaccesible.

**Fix:** Agregar en el `TabsList`:
```tsx
<TabsTrigger value="norut">No Rutinarias</TabsTrigger>
```

## Flujo de usuario

1. Usuario ve lista de tareas en tab "Items"
2. En un card con `status === "ABIERTO"` y sin no rutinaria, aparece botón "Generar No Rutinaria"
3. Click en botón → abre `CreateNoRutineDialog` controlado por `RoutineTasksList`
4. Usuario completa el formulario (pasos 1-3 del form existente)
5. Al confirmar, se hace POST a `/{company}/non-routine` con `work_order_task_id`
6. El query de la work order se invalida → la UI se actualiza → el botón desaparece del card (ya tiene `non_routine`)

## Compatibilidad

- `TaskCard` también se usa en `NoRoutineTasksList` con `isNonRoutine={true}` — el botón nunca aparece ahí porque la condición incluye `!isNonRoutine`
- `CreateNoRutineDialog` también sigue existiendo en `TaskDetailsDialog` — no se elimina, ambos puntos de acceso coexisten
