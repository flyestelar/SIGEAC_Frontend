import { AxiosError } from 'axios';

type FlightAction = 'create' | 'update' | 'delete';

const FALLBACK_DESCRIPTION: Record<FlightAction, string> = {
  create: 'No se pudo registrar el vuelo...',
  update: 'No se pudo actualizar el vuelo...',
  delete: 'No se pudo eliminar el vuelo...',
};

interface LaravelErrorPayload {
  message?: string;
  errors?: Record<string, string[]>;
}

export interface FlightToastError {
  title: string;
  description: string;
}

export function getFlightToastError(error: unknown, action: FlightAction): FlightToastError {
  const fallback: FlightToastError = {
    title: 'Oops!',
    description: FALLBACK_DESCRIPTION[action],
  };

  const axiosError = error as AxiosError<LaravelErrorPayload> | undefined;
  const data = axiosError?.response?.data;
  if (!data) return fallback;

  // Laravel 422: agrupa los mensajes de validación campo por campo.
  if (data.errors && typeof data.errors === 'object') {
    const flat = Object.values(data.errors).flat().filter(Boolean);
    if (flat.length > 0) {
      return { title: 'Datos inválidos', description: flat.join(' · ') };
    }
  }

  if (typeof data.message === 'string' && data.message.trim().length > 0) {
    return { title: 'Oops!', description: data.message };
  }

  return fallback;
}
