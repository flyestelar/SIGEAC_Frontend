// Regression test para el lookup del detalle de vuelo.
// Bug original: la ruta [flight_number]/page.tsx hacía
//   flights.find(f => f.flight_number === param)
// que es ambiguo (flight_number opcional + no único). Pasamos a buscar
// por id y la ruta es [id]/page.tsx.
//
// Ejecutar:  npm run diagnose:flight-detail
// Sale con código 1 si cualquier caso falla.

import type { FlightControl } from '../types/index.ts';
import { findFlightById } from '../actions/planificacion/vuelos/flight-lookup.ts';

const aircraft = { id: 1, acronym: 'YV3320' } as FlightControl['aircraft'];

const baseFlight = {
  aircraft_operator: 'Pedro',
  origin: 'CCS',
  destination: 'PZO',
  departure_time: '08:00',
  arrival_time: '09:00',
  flight_hours: 1,
  flight_cycles: 1,
  aircraft,
} as const;

const fixtures: { name: string; flights: FlightControl[]; targetId: string }[] = [
  {
    name: 'dos vuelos ETR199 en días distintos → abrir el segundo',
    flights: [
      { id: '1', flight_number: 'ETR199', flight_date: '2026-06-01', ...baseFlight } as unknown as FlightControl,
      { id: '2', flight_number: 'ETR199', flight_date: '2026-06-02', ...baseFlight } as unknown as FlightControl,
    ],
    targetId: '2',
  },
  {
    name: 'vuelo sin flight_number → debe ser navegable por id',
    flights: [{ id: '3', flight_date: '2026-06-03', ...baseFlight } as unknown as FlightControl],
    targetId: '3',
  },
  {
    name: 'vuelo con número único (caso feliz)',
    flights: [{ id: '4', flight_number: 'ETR200', flight_date: '2026-06-04', ...baseFlight } as unknown as FlightControl],
    targetId: '4',
  },
  {
    name: 'id como number (FlightControl.id puede llegar como number)',
    flights: [{ id: 5 as unknown as string, flight_number: 'ETR201', flight_date: '2026-06-05', ...baseFlight } as unknown as FlightControl],
    targetId: '5',
  },
];

let failures = 0;
for (const f of fixtures) {
  const found = findFlightById(f.flights, f.targetId);
  const ok = String(found?.id ?? '') === f.targetId;
  if (!ok) failures++;
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${f.name}`);
  console.log(`        encontrado: id=${found?.id ?? 'none'}`);
  console.log('');
}

if (failures > 0) {
  console.log(`\n${failures}/${fixtures.length} FAIL`);
  process.exit(1);
} else {
  console.log(`\n${fixtures.length}/${fixtures.length} PASS — el detalle resuelve sin ambigüedad.`);
}
