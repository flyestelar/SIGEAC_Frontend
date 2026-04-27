import axiosInstance from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CreateFlightControlData {
  aircraft_id: string;
  flight_number?: string;
  aircraft_operator: string;
  origin: string;
  destination: string;
  flight_date: string;
  departure_time?: string;
  arrival_time?: string;
  flight_hours: number;
  flight_cycles: number;
}

export const useCreateFlightControl = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async ({ data, company }: { data: CreateFlightControlData; company: string }) => {
      await axiosInstance.post(`/${company}/flight-control`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight-control'] });
      toast.success('¡Creado!', {
        description: `El vuelo ha sido registrado correctamente.`,
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo registrar el vuelo...',
      });
      console.error(error);
    },
  });

  return { createFlightControl: createMutation };
};

export const useUpdateFlightControl = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      company,
    }: {
      id: string;
      data: Partial<CreateFlightControlData>;
      company: string;
    }) => {
      await axiosInstance.put(`/${company}/flight-control/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight-control'] });
      toast.success('¡Actualizado!', {
        description: `El vuelo ha sido actualizado correctamente.`,
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo actualizar el vuelo...',
      });
      console.error(error);
    },
  });

  return { updateFlightControl: updateMutation };
};

export const useDeleteFlightControl = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ id, company }: { id: string; company: string }) => {
      await axiosInstance.delete(`/${company}/flight-control/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight-control'] });
      toast.success('¡Eliminado!', {
        description: 'El vuelo ha sido eliminado correctamente.',
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo eliminar el vuelo...',
      });
      console.error(error);
    },
  });

  return { deleteFlightControl: deleteMutation };
};
