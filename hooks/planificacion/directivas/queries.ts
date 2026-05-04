import {
  airworthinessDirectiveComplianceControlsDestroyMutation,
  airworthinessDirectiveComplianceControlsStoreExecutionMutation,
  airworthinessDirectiveComplianceControlsStoreMutation,
  airworthinessDirectiveComplianceControlsUpdateMutation,
  airworthinessDirectiveApplicabilitiesIndexOptions,
  airworthinessDirectiveApplicabilitiesIndexQueryKey,
  airworthinessDirectiveApplicabilitiesDestroyMutation,
  airworthinessDirectiveApplicabilitiesUpdateMutation,
  airworthinessDirectiveApplicabilitiesStoreMutation,
  airworthinessDirectiveApplicabilitiesShowQueryKey,
  airworthinessDirectivesComplianceControlsOptions,
  airworthinessDirectivesComplianceControlsQueryKey,
  airworthinessDirectivesComplianceRecordsOptions,
  airworthinessDirectivesComplianceRecordsQueryKey,
  airworthinessDirectivesIndexOptions,
  airworthinessDirectivesIndexQueryKey,
  airworthinessDirectivesShowOptions,
  airworthinessDirectivesStoreMutation,
} from '@api/queries';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type AirworthinessDirectiveComplianceListQuery = {
  search?: string | null;
  aircraft_id?: number;
  order_by?: 'newest' | 'oldest' | 'aircraft';
  page?: number;
  per_page?: number;
};

export const useGetAirworthinessDirectives = () => {
  return useQuery({
    ...airworthinessDirectivesIndexOptions(),
  });
};

export const useGetAirworthinessDirectiveDetail = (id: number | undefined) => {
  return useQuery({
    ...airworthinessDirectivesShowOptions({
      path: { id: id ?? 0 },
    }),
    enabled: !!id,
  });
};

export const useGetAirworthinessDirectiveApplicabilities = (id: number | undefined) => {
  return useQuery({
    ...airworthinessDirectiveApplicabilitiesIndexOptions({
      path: { directiveId: id ?? 0 },
    }),
    enabled: !!id,
  });
};

export const useGetAirworthinessDirectiveComplianceControls = (
  id: number | undefined,
  query?: AirworthinessDirectiveComplianceListQuery,
) => {
  return useQuery({
    ...airworthinessDirectivesComplianceControlsOptions({
      path: { id: id ?? 0 },
      query,
    }),
    enabled: !!id,
  });
};

export const useGetAirworthinessDirectiveComplianceRecords = (
  id: number | undefined,
  query?: AirworthinessDirectiveComplianceListQuery,
) => {
  return useQuery({
    ...airworthinessDirectivesComplianceRecordsOptions({
      path: { id: id ?? 0 },
      query,
    }),
    enabled: !!id,
  });
};

export const useCreateAirworthinessDirective = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...airworthinessDirectivesStoreMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesIndexQueryKey(),
      });
      toast.success('Directiva creada', {
        description: 'La directiva fue registrada correctamente.',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'No se pudo registrar la directiva.';
      toast.error('Error al crear directiva', {
        description: message,
      });
    },
  });
};

export const useCreateAirworthinessDirectiveApplicability = (directiveId: number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...airworthinessDirectiveApplicabilitiesStoreMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectiveApplicabilitiesIndexQueryKey({
          path: { directiveId: directiveId ?? 0 },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesShowOptions({
          path: { id: directiveId ?? 0 },
        }).queryKey,
      });
      toast.success('Aplicabilidad creada', {
        description: 'La aplicabilidad fue registrada correctamente.',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'No se pudo registrar la aplicabilidad.';
      toast.error('Error al crear aplicabilidad', {
        description: message,
      });
    },
  });
};

export const useUpdateAirworthinessDirectiveApplicability = (directiveId: number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...airworthinessDirectiveApplicabilitiesUpdateMutation(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectiveApplicabilitiesIndexQueryKey({
          path: { directiveId: directiveId ?? 0 },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectiveApplicabilitiesShowQueryKey({
          path: {
            directiveId: directiveId ?? 0,
            applicabilityId: variables.path.applicabilityId,
          },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesShowOptions({
          path: { id: directiveId ?? 0 },
        }).queryKey,
      });
      toast.success('Aplicabilidad actualizada', {
        description: 'La aplicabilidad fue actualizada correctamente.',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'No se pudo actualizar la aplicabilidad.';
      toast.error('Error al actualizar aplicabilidad', {
        description: message,
      });
    },
  });
};

export const useDeleteAirworthinessDirectiveApplicability = (directiveId: number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...airworthinessDirectiveApplicabilitiesDestroyMutation(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectiveApplicabilitiesIndexQueryKey({
          path: { directiveId: directiveId ?? 0 },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesShowOptions({
          path: { id: directiveId ?? 0 },
        }).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectiveApplicabilitiesShowQueryKey({
          path: {
            directiveId: directiveId ?? 0,
            applicabilityId: variables.path.applicabilityId,
          },
        }),
      });
      toast.success('Aplicabilidad eliminada', {
        description: 'La aplicabilidad fue eliminada correctamente.',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'No se pudo eliminar la aplicabilidad.';
      toast.error('Error al eliminar aplicabilidad', {
        description: message,
      });
    },
  });
};

export const useCreateAirworthinessDirectiveComplianceControl = (directiveId: number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...airworthinessDirectiveComplianceControlsStoreMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesComplianceControlsQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesShowOptions({
          path: { id: directiveId ?? 0 },
        }).queryKey,
      });
      toast.success('Control creado', {
        description: 'El control de cumplimiento fue registrado correctamente.',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'No se pudo registrar el control de cumplimiento.';
      toast.error('Error al crear control', {
        description: message,
      });
    },
  });
};

export const useUpdateAirworthinessDirectiveComplianceControl = (directiveId: number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...airworthinessDirectiveComplianceControlsUpdateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesComplianceControlsQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesShowOptions({
          path: { id: directiveId ?? 0 },
        }).queryKey,
      });
      toast.success('Control actualizado', {
        description: 'El control de cumplimiento fue actualizado correctamente.',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'No se pudo actualizar el control de cumplimiento.';
      toast.error('Error al actualizar control', {
        description: message,
      });
    },
  });
};

export const useDeleteAirworthinessDirectiveComplianceControl = (directiveId: number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...airworthinessDirectiveComplianceControlsDestroyMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesComplianceControlsQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesShowOptions({
          path: { id: directiveId ?? 0 },
        }).queryKey,
      });
      toast.success('Control eliminado', {
        description: 'El control de cumplimiento fue eliminado correctamente.',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'No se pudo eliminar el control de cumplimiento.';
      toast.error('Error al eliminar control', {
        description: message,
      });
    },
  });
};

export const useCreateAirworthinessDirectiveComplianceExecution = (directiveId: number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...airworthinessDirectiveComplianceControlsStoreExecutionMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesComplianceControlsQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesComplianceRecordsQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesShowOptions({
          path: { id: directiveId ?? 0 },
        }).queryKey,
      });
      toast.success('Cumplimiento registrado', {
        description: 'La ejecución fue registrada correctamente.',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'No se pudo registrar la ejecución de cumplimiento.';
      toast.error('Error al registrar cumplimiento', {
        description: message,
      });
    },
  });
};