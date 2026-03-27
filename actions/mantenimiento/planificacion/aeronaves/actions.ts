import axiosInstance from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CreateAircraftWithPartsData {
  aircraft: {
    manufacturer_id: number;
    aircraft_type_id: number;
    serial: string;
    acronym: string;
    flight_hours: number;
    flight_cycles: number;
    fabricant_date: Date;
    comments?: string;
    location_id: string;
  };
  parts: {
    part_name: string;
    part_number: string;
    total_flight_hours: number;
    total_flight_cycles: number;
  }[];
}

export const useCreateMaintenanceAircraft = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async ({ data, company }: { data: CreateAircraftWithPartsData; company: string }) => {
      await axiosInstance.post(`/${company}/aircrafts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircrafts'] });
      toast.success('¡Creado!', {
        description: `La aeronave ha sido creada correctamente.`,
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo crear la aeronave...',
      });
      console.log(error);
    },
  });
  return {
    createMaintenanceAircraft: createMutation,
  };
};

export const useDeleteMaintenanceAircraft = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ id, company }: { id: number | string; company: string }) => {
      await axiosInstance.delete(`/${company}/aircrafts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircrafts'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['aircraft'], exact: false });
      toast.success('¡Eliminado!', {
        description: `¡La aeronave ha sido eliminado correctamente!`,
      });
    },
    onError: (e) => {
      toast.error('Oops!', {
        description: '¡Hubo un error al eliminar la aeronave!',
      });
    },
  });

  return {
    deleteAircraft: deleteMutation,
  };
};

export const useUpdateMaintenanceAircraft = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({
      acronym,
      company,
      data,
    }: {
      acronym: string;
      company: string;
      data: { aircraft_type_id: number };
    }) => {
      await axiosInstance.put(`/${company}/aircrafts/${acronym}`, { aircraft: data });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aircrafts'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['aircraft-parts', variables.acronym, variables.company] });
      toast.success('¡Actualizado!', {
        description: 'El tipo de aeronave fue actualizado correctamente.',
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo actualizar el tipo de aeronave.',
      });
      console.log(error);
    },
  });

  return {
    updateMaintenanceAircraft: updateMutation,
  };
};
