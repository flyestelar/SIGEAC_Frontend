# Guion de Demostración — Módulo de Planificación

> **Propósito:** Presentar al cliente las capacidades del módulo de Planificación del sistema SIGEAC.
> **Audiencia:** Gerentes de mantenimiento, planificadores, analistas de planificación.
> **Duración estimada:** 35-45 minutos.
> **Roles que participan:** `ANALISTA_PLANIFICACION`, `JEFE_PLANIFICACION`, `SUPERUSER`.

---

## Índice de la demostración

| # | Sección | Duración |
|---|---------|----------|
| 1 | Registro de Aeronaves | 5 min |
| 2 | Control de Horas de Vuelo | 4 min |
| 3 | Dashboard de Control de Mantenimiento | 6 min |
| 4 | Control de Hard Time | 6 min |
| 5 | Directivas de Aeronavegabilidad | 5 min |
| 6 | Alertas de Vencimiento | 4 min |
| 7 | Órdenes de Trabajo | 7 min |
| 8 | Calendario de Servicios | 3 min |

---

## 1. Registro de Aeronaves (5 min)

**Ruta:** `/[empresa]/planificacion/aeronaves`

### Narrativa
> *"Empezamos por la base de todo el módulo: el registro maestro de aeronaves. Cada aeronave tiene su perfil técnico completo, y de aquí se alimentan todas las funcionalidades que veremos después."*

### Pasos en pantalla

1. **Grid de aeronaves** — Mostrar las tarjetas con:
   - Imagen representativa con matrícula superpuesta
   - Tipo de aeronave y fabricante
   - Serial (S/N)
   - Horas de vuelo y ciclos acumulados en el footer

2. **Filtro de búsqueda** — Escribir en el campo de búsqueda para filtrar por acrónimo, serial o tipo. Señalar el contador "X de Y aeronaves mostradas".

3. **Perfil de aeronave** — Hacer clic en una aeronave para ver la página de detalle:
   - **Estadísticas**: tipo, fabricante, serial, horas, ciclos, ubicación, fecha de fabricación
   - **Promedio diario**: horas y ciclos promedio por día (gráfica)
   - **Componentes Hard Time**: listado de componentes con sus intervalos
   - **Historial de instalaciones**: registro cronológico de componentes montados/desmontados

4. **Registrar aeronave** — Clic en "Registrar aeronave". Mostrar:
   - Formulario de datos básicos (matrícula, serial, tipo, fabricante, horas/ciclos iniciales)
   - Registro de componentes iniciales
   - Integración con tipos de aeronave predefinidos

> **💡 Punto clave:** *"Cada aeronave arrastra sus horas y ciclos desde el registro inicial. Esto alimenta todos los cálculos de vencimiento que veremos en las siguientes secciones."*

---

## 2. Control de Horas de Vuelo (4 min)

**Ruta:** `/[empresa]/planificacion/control_vuelos/vuelos`

### Narrativa
> *"Una vez que tenemos las aeronaves registradas, el siguiente paso natural es capturar su operación. Cada vuelo reportado actualiza las horas y ciclos, y eso dispara los cálculos de mantenimiento."*

### Pasos en pantalla

1. **Selector de aeronave** — Elegir una aeronave para ver sus vuelos.

2. **Listado de vuelos** — Mostrar la tabla con:
   - Fecha, origen/destino, operador
   - Horas de vuelo y ciclos
   - Número de vuelo (opcional)

3. **Resumen operativo** — Panel lateral con:
   - Total de vuelos, horas acumuladas, ciclos acumulados
   - Promedio diario de horas y ciclos (gráfica)

4. **CRUD de vuelos** — Mostrar la creación, edición y eliminación de un registro de vuelo en tiempo real.

> **💡 Punto clave:** *"Cada vez que se registra un vuelo, el sistema recalcula automáticamente las proyecciones de vencimiento de todos los controles y componentes de esa aeronave. Es el motor que impulsa las alertas."*

---

## 3. Dashboard de Control de Mantenimiento (6 min)

**Ruta:** `/[empresa]/planificacion/control_mantenimiento`

### Narrativa
> *"Con las aeronaves y su uso ya registrados, pasamos al corazón de la planificación: el Control de Mantenimiento. Aquí se definen y supervisan todos los controles programados para la flota."*

### Pasos en pantalla

1. **Selector de aeronave** — Mostrar el `AircraftSelector`. Hacer clic en una aeronave para ver solo sus controles asociados.

2. **Vista de cuadrícula vs. tabla** — Alternar entre las vistas disponibles. La vista de tarjetas da un pantallazo rápido del estado de cada control; la vista de tabla permite ordenar y buscar.

3. **Tarjeta de control individual** — Hacer clic en un control para expandir el detalle:
   - **Título y referencia del manual**
   - **Intervalos** (FH, FC, días) con indicadores de progreso
   - **Estado general**: OK (verde), PRÓXIMO (ámbar), VENCIDO (rojo)
   - **Último cumplimiento** y proyección del próximo vencimiento

4. **Pestañas de detalle** — Dentro de un control expandido:
   - **Tasks**: tarjetas de tarea asociadas con sus intervalos individuales.
   - **Gráficas**: panel de estimaciones con proyecciones visuales.
   - **Últimos Cumplimientos**: historial de ejecuciones registradas.

5. **Nuevo control** — Clic en "Nuevo Control". Mostrar el formulario donde se define:
   - Título, descripción, referencia del manual
   - Intervalo (expresión como "500 FH" o "12 meses")
   - Asignación a una o varias aeronaves
   - Tarjetas de tarea asociadas

> **💡 Punto clave:** *"Cada control puede aplicarse a múltiples aeronaves. El sistema calcula automáticamente las proyecciones de vencimiento usando las horas y ciclos que vimos en la sección anterior."*

---

## 4. Control de Hard Time (6 min)

**Ruta:** `/[empresa]/planificacion/hard_time`

### Narrativa
> *"Pasamos ahora al control granular por componente. Mientras que el Control de Mantenimiento trabaja a nivel de sistema, Hard Time gestiona piezas individuales con vida útil limitada."*

### Pasos en pantalla

1. **Selector de aeronave** — Elegir una aeronave con componentes instalados.

2. **Sidebar de categorías** — Mostrar cómo los componentes se agrupan por categoría (ATA chapter). Hacer clic en una categoría para filtrar.

3. **Vista de detalle de componente** — Seleccionar un componente:
   - Part number, descripción, posición
   - Intervalos definidos (FH, FC, días)
   - Estado actual: tiempo transcurrido vs. límite
   - Barra de progreso visual
   - Última instalación y proyección de vencimiento

4. **Acciones sobre componente**:
   - **Montar (Install)**: registrar instalación de un componente nuevo
   - **Desmontar (Uninstall)**: retirar componente con registro de causa
   - **Registrar Cumplimiento**: ejecutar el intervalo (reset)
   - **Editar intervalo**: modificar los límites definidos

5. **Solicitudes de instalación** — Ir a `hard_time/solicitudes` y mostrar:
   - Listado de solicitudes pendientes / aprobadas / rechazadas
   - Flujo de aprobación/rechazo

6. **Importación desde Excel** — Mencionar la capacidad de importar estructura completa de componentes mediante plantilla.

> **💡 Punto clave:** *"Hard Time permite un control granular por componente, no por aeronave. Cada pieza sigue su propio calendario basado en las horas y ciclos de vuelo que registramos antes."*

---

## 5. Directivas de Aeronavegabilidad (5 min)

**Ruta:** `/[empresa]/planificacion/directivas`

### Narrativa
> *"Complementando los controles internos, tenemos las Directivas de Aeronavegabilidad. Son mandatos regulatorios externos que debemos cumplir, y este módulo centraliza su seguimiento."*

### Pasos en pantalla

1. **Dashboard de ADs** — Mostrar las cards de resumen:
   - Total de directivas, recurrentes, con PDF, controles abiertos
   - Badges de estado: próximas (ámbar), vencidas (rojo)

2. **Listado** — Tabla con columnas: Directiva (AD), autoridad, emisión, vigencia, aplicabilidad, control, documento.

3. **Filtro y búsqueda** — Buscar por AD, autoridad o asunto.

4. **Detalle de directiva** — Hacer clic en una AD:
   - Información general: número AD, autoridad, fechas
   - **Aplicabilidad**: aeronaves afectadas con sus matrículas
   - **Control de Cumplimiento**: tareas asociadas, estado (vencido/próximo/cerrado)
   - **Historial**: registros de ejecución
   - Vista previa del PDF

5. **Nueva directiva** — Clic en "Nueva directiva":
   - Datos base: N° AD, autoridad, asunto, fechas
   - Configuración opcional de controles de cumplimiento iniciales

> **💡 Punto clave:** *"Al igual que los controles de mantenimiento, las ADs generan alertas cuando están próximas a vencer. Es el mismo mecanismo que veremos a continuación."*

---

## 6. Alertas de Vencimiento (4 min)

**Ruta:** `/[empresa]/planificacion/alertas`

### Narrativa
> *"Ahora que hemos configurado controles de mantenimiento, componentes Hard Time y directivas, veamos cómo el sistema consolida todo en un panel de alertas. Este es el termómetro de la flota."*

### Pasos en pantalla

1. **Resumen por estado** — Mostrar las 4 tarjetas superiores:
   - **Vencidos** (rojo): atención inmediata
   - **Próximos** (ámbar): ventana de atención
   - **En tiempo** (verde): sin riesgo
   - **Total**

2. **Filtros** — Usar los selectores para filtrar por:
   - Aeronave específica
   - Tipo de alerta (Control de Mantenimiento, Hard Time, Directiva)
   - Estado (Vencido, Próximo, OK)

3. **Tabla de alertas** — Mostrar el listado detallado con:
   - Aeronave, tipo de ítem, descripción
   - Métrica gobernante (calendario, FH, FC)
   - Fecha/valor proyectado
   - Días o unidades restantes
   - Badge de estado

> **💡 Punto clave:** *"Este panel unifica las alertas de Control de Mantenimiento, Hard Time y Directivas en un solo lugar. Es lo que un planificador revisa cada mañana para priorizar su día."*

---

## 7. Órdenes de Trabajo (7 min)

**Ruta:** `/[empresa]/planificacion/ordenes_trabajo`

### Narrativa
> *"Llegamos a la parte ejecutable. Basándose en las alertas y la planificación, los planificadores crean Órdenes de Trabajo para convertir las tareas pendientes en acción concreta sobre la flota."*

### Pasos en pantalla

1. **Listado paginado** — Mostrar la tabla con columnas: N° de orden, aeronave, tally, estado, fechas. Usar búsqueda por texto.

2. **Estados de orden** — Badges con código de color:
   - `OPEN` / `IN_PROGRESS`: pendiente
   - `COMPLETED`: completada
   - `CANCELLED`: cancelada

3. **Detalle de orden** — Hacer clic en una orden:
   - **Header**: N° de orden, estado, tally, fechas, ubicación
   - **Sección de aeronave**: matrícula, tipo, fabricante, horas/ciclos
   - **WorkOrderTabs**: tareas, documentación adjunta, comentarios

4. **Crear orden** — Mostrar el `WorkOrderCreator`:
   - Aeronave, tipo de mantenimiento, tally
   - Fechas estimadas de entrada/salida
   - Observaciones

5. **Acciones rápidas** — Botones de completar tareas en lote y completar orden.

> **💡 Punto clave:** *"Al completar una orden de trabajo, el sistema actualiza automáticamente los registros de cumplimiento de los controles de mantenimiento y Hard Time asociados. Cierra el ciclo: planificar → ejecutar → registrar."*

---

## 8. Calendario de Servicios (3 min)

**Ruta:** `/[empresa]/planificacion/calendario`

### Narrativa
> *"Cerramos con una vista integrada de todo lo planificado. El calendario unifica órdenes de trabajo, servicios y eventos programados en una línea de tiempo visual."*

### Pasos en pantalla

1. **Vista mensual/semanal** — Mostrar el calendario con eventos de servicios y órdenes de trabajo agendadas.

2. **Colores por prioridad**:
   - Rojo: prioridad alta
   - Ámbar: prioridad media
   - Verde: prioridad baja

3. **Interacción** — Hacer clic en un evento para ver detalles. Crear un nuevo evento desde el calendario.

> **💡 Punto clave:** *"El calendario es la vista panorámica de toda la planificación. Los planificadores pueden arrastrar y soltar eventos para reprogramar, y todo está sincronizado con el resto del módulo."*

---

## Resumen de Cierre

> *"En resumen, el módulo de Planificación les permite:*
>
> 1. *Registrar aeronaves con su perfil técnico completo*
> 2. *Capturar la operación diaria con horas de vuelo y ciclos*
> 3. *Configurar controles de mantenimiento programados por flota*
> 4. *Monitorear componentes Hard Time con intervalos individuales*
> 5. *Dar seguimiento a directivas de aeronavegabilidad obligatorias*
> 6. *Recibir alertas proactivas de todo lo que está por vencer*
> 7. *Ejecutar órdenes de trabajo que actualizan el cumplimiento*
> 8. *Visualizar todo en un calendario integrado*
>
> *Cada paso alimenta al siguiente, cerrando el círculo de planificación → ejecución → registro."*

---

## Preparación Técnica

Antes de la demo, asegurar:

1. **Datos de prueba:** Mínimo 3 aeronaves registradas con horas/ciclos, 5-8 controles de mantenimiento con distintos estados, 5+ componentes Hard Time, 3+ directivas, 10+ vuelos, 5+ órdenes de trabajo.
2. **Varios estados:** Asegurar que haya al menos un control VENCIDO, uno PRÓXIMO y uno OK para mostrar las alertas.
3. **Red:** Conexión estable al servidor backend.
4. **Resolución:** 1920×1080 mínimo para una visualización cómoda.
5. **Usuario demo:** Con rol `JEFE_PLANIFICACION` o `SUPERUSER`.
