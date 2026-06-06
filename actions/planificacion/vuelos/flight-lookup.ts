import type { FlightControl } from '@/types';

export function findFlightById(flights: FlightControl[] | undefined, id: string): FlightControl | undefined {
  if (!flights?.length || !id) return undefined;
  return flights.find((f) => String(f.id) === id);
}
