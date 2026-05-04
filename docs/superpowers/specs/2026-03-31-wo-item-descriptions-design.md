# Diseno: Descripciones por Item en la Creacion de WO

Fecha: 2026-03-31

## Contexto

La pantalla de creacion de WO en [app/[company]/planificacion/ordenes_trabajo/crear/page.tsx](/home/angeldaj/Work/ETR/SIGEAC_Frontend_ETR/app/[company]/planificacion/ordenes_trabajo/crear/page.tsx) permite:

- seleccionar una aeronave
- seleccionar controles de mantenimiento asociados
- seleccionar task cards dentro de cada control

Actualmente el flujo arma un payload por `aircraft_id` y una lista de `items`, donde cada item contiene:

- `maintenance_control_id`
- `maintenance_control_tasks_ids`

El submit real todavia no esta activo en `WorkOrderCreator`; el flujo llega solo hasta construir el payload.

## Objetivo

Agregar una `description` obligatoria por cada item de WO.

Regla de negocio validada:

- cada control seleccionado representa un item en la WO impresa
- por lo tanto, la descripcion se captura por control, no por task card
- la descripcion debe venir precargada con `control.title`
- la descripcion no puede enviarse vacia

El nuevo formato de cada item sera:

```ts
{
  description: string;
  maintenance_control_id: number;
  maintenance_control_tasks_ids: number[];
}
```

## Opcion Elegida

Se usara un dialog final de confirmacion.

Al pulsar `Generar Orden de Trabajo`, no se enviara inmediatamente la WO. En su lugar, se abrira un dialog con una fila por cada control seleccionado. Cada fila permitira editar la descripcion del item antes de confirmar el submit final.

## Diseno del Flujo

### 1. Seleccion actual

La pantalla principal mantiene su flujo actual:

- elegir aeronave
- elegir task cards por control
- ver resumen lateral

No se agregaran inputs de descripcion dentro de `ControlsList` ni dentro de `SelectionSummary`.

### 2. Apertura del dialog

Cuando existan task cards seleccionadas y el usuario pulse el CTA del resumen:

- se abre un `Dialog`
- se muestra un item por cada control con seleccion activa
- cada item incluye:
  - nombre del control
  - referencia manual
  - cantidad de task cards seleccionadas
  - campo editable `description`

La `description` inicial sera `control.title`.

### 3. Confirmacion

Al confirmar en el dialog:

- se validan todas las descripciones con `trim()`
- si alguna queda vacia, se bloquea el envio y se muestra el error en esa fila
- si todas son validas, se arma el payload final con `description`
- se ejecuta `createWorkOrder.mutateAsync(...)`
- si sale bien, se navega a `/{company}/planificacion/ordenes_trabajo`
- si falla, el dialog permanece abierto

## Estructura de Estado

La pantalla necesita almacenar, por control seleccionado:

- ids de task cards seleccionadas
- descripcion del item

La estructura recomendada en `WorkOrderCreator` es un mapa por `controlId`, por ejemplo:

```ts
Map<number, {
  taskCardIds: Set<number>;
  description: string;
}>
```

Comportamiento esperado:

- al seleccionar la primera task card de un control, se crea la entrada con `description = control.title`
- al seleccionar mas task cards del mismo control, se conserva la descripcion
- al quitar la ultima task card de un control, se elimina el item completo del mapa
- al cambiar de aeronave, se limpia toda la seleccion

## Cambios de Componentes

### WorkOrderCreator

Responsabilidades nuevas:

- mantener el estado de items seleccionados con `description`
- exponer handlers para actualizar descripcion por control
- abrir y cerrar el dialog
- construir el payload final
- ejecutar el submit real

### SelectionSummary

Se mantiene como resumen y punto de entrada al paso final.

Cambios:

- el boton deja de representar submit directo
- pasa a abrir el dialog de confirmacion
- `isSubmitting` sigue reflejando el estado del mutation final

### Nuevo componente: WorkOrderItemsDialog

Responsabilidades:

- renderizar la lista de items seleccionados
- permitir editar `description`
- mostrar errores de validacion
- confirmar o cancelar

Este componente debe ser controlado desde `WorkOrderCreator`.

## Contrato de Datos

Actualizar `CreateWorkOrderData` en `actions/planificacion/ordenes_trabajo/actions.ts` para incluir `description` como campo requerido por item.

Nuevo contrato:

```ts
export interface CreateWorkOrderData {
  aircraft_id: number;
  items: {
    description: string;
    maintenance_control_id: number;
    maintenance_control_tasks_ids: number[];
  }[];
}
```

No se propone cambiar la ruta ni la firma externa del mutation, solo el contenido de `data`.

## Validaciones y Errores

- el boton principal sigue deshabilitado si no hay task cards seleccionadas
- el dialog no debe permitir confirmacion efectiva con descripciones vacias
- el error debe mostrarse junto al campo invalido
- si el backend responde con error, se conserva el contenido del dialog para reintento

## Alcance

Incluye:

- nuevo paso final via dialog
- nuevo campo `description` en cada item
- validacion requerida
- activacion del submit real si el flujo ya queda listo

No incluye:

- cambios de layout mayores
- cambios de impresion de la WO
- cambios de backend fuera del contrato consumido por frontend
- soporte para descripcion por task card

## Verificacion Esperada

- seleccionar aeronave
- seleccionar uno o mas controles con task cards
- abrir dialog
- ver descripcion precargada con `control.title`
- editar descripcion
- impedir confirmacion si una descripcion queda vacia
- confirmar envio exitoso
- validar que el payload incluya `description` por item
