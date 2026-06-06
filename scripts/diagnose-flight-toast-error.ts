// Regression test para el handler de errores de control_vuelos.
// Bug original: el toast.error mostraba siempre el mensaje genérico,
// descartando lo que el backend devolvía en response.data.{message,errors}.
//
// Ejecutar:  node --experimental-strip-types scripts/diagnose-flight-toast-error.ts
// Sale con código 1 si cualquier caso falla.

import { getFlightToastError } from '../actions/planificacion/vuelos/error-handlers.ts';

type Fixture = {
  name: string;
  action: 'create' | 'update' | 'delete';
  error: unknown;
  expectedSubstring: string | null; // null = aceptamos el fallback genérico
};

const fixtures: Fixture[] = [
  {
    name: '422 con message simple (create)',
    action: 'create',
    error: {
      response: {
        status: 422,
        data: { message: 'El número de vuelo ya existe para esta aeronave.' },
      },
    },
    expectedSubstring: 'número de vuelo ya existe',
  },
  {
    name: '422 con errors[] (Laravel validation, update)',
    action: 'update',
    error: {
      response: {
        status: 422,
        data: {
          message: 'The given data was invalid.',
          errors: {
            flight_date: ['La fecha no puede ser futura.'],
            origin: ['El campo origen es obligatorio.'],
          },
        },
      },
    },
    expectedSubstring: 'fecha no puede ser futura',
  },
  {
    name: '500 sin response.data.message (delete)',
    action: 'delete',
    error: { response: { status: 500, data: {} } },
    expectedSubstring: null,
  },
  {
    name: 'error de red sin response (create)',
    action: 'create',
    error: { message: 'Network Error' },
    expectedSubstring: null,
  },
];

let failures = 0;
for (const f of fixtures) {
  const { title, description } = getFlightToastError(f.error, f.action);
  const ok =
    f.expectedSubstring === null
      ? description.length > 0
      : description.toLowerCase().includes(f.expectedSubstring.toLowerCase());

  const status = ok ? 'PASS' : 'FAIL';
  if (!ok) failures++;

  console.log(`[${status}] ${f.name}`);
  console.log(`        toast: "${title}" — "${description}"`);
  if (f.expectedSubstring) console.log(`        esperado: contiene "${f.expectedSubstring}"`);
  console.log('');
}

if (failures > 0) {
  console.log(`\n${failures}/${fixtures.length} casos FAIL`);
  process.exit(1);
} else {
  console.log(`\n${fixtures.length}/${fixtures.length} PASS — handler propaga el error del backend.`);
}
