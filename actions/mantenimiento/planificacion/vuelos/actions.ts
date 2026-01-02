import axiosInstance from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CreateFlightControlData {
  aircraft_id: string;
  flight_cycles: number;
  flight_hours: number;
  flight_number: string;
  origin: string;
  destination: string;
  pilot: string;
  co_pilot: string;
  arrival_time: string;
  departure_time: string;
  flight_date: string;
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
      console.log(error);
    },
  });
  return {
    createFlightControl: createMutation,
  };
};
