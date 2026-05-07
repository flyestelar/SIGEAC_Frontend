import { axiosErrorToast } from '@/lib/axios';
import {
  airworthinessDirectiveApplicabilitiesBulkStoreMutation,
  airworthinessDirectiveApplicabilitiesDestroyMutation,
  airworthinessDirectiveApplicabilitiesIndexOptions,
  airworthinessDirectiveApplicabilitiesIndexQueryKey,
  airworthinessDirectiveApplicabilitiesShowQueryKey,
  airworthinessDirectiveApplicabilitiesStoreMutation,
  airworthinessDirectiveApplicabilitiesUpdateMutation,
  airworthinessDirectiveComplianceControlsDestroyMutation,
  airworthinessDirectiveComplianceControlsStoreExecutionMutation,
  airworthinessDirectiveComplianceControlsStoreMutation,
  airworthinessDirectiveComplianceControlsUpdateMutation,
  airworthinessDirectivesComplianceControlsOptions,
  airworthinessDirectivesComplianceControlsQueryKey,
  airworthinessDirectivesComplianceRecordsOptions,
  airworthinessDirectivesComplianceRecordsQueryKey,
  airworthinessDirectivesIndexOptions,
  airworthinessDirectivesIndexQueryKey,
  airworthinessDirectivesShowOptions,
  airworthinessDirectivesShowQueryKey,
  airworthinessDirectivesStoreMutation,
  airworthinessDirectivesUpdateMutation,
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
    onError: axiosErrorToast({
      title: 'Error al crear directiva',
      defaultDescription: 'No se pudo registrar la directiva.',
    }),
  });
};

export const useUpdateAirworthinessDirective = (id: number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...airworthinessDirectivesUpdateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: airworthinessDirectivesIndexQueryKey() });
      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesShowQueryKey({ path: { id: id ?? 0 } }),
      });
      toast.success('Directiva actualizada', {
        description: 'Los datos de la directiva fueron actualizados correctamente.',
      });
    },
    onError: axiosErrorToast({
      title: 'Error al actualizar directiva',
      defaultDescription: 'No se pudo actualizar la directiva.',
    }),
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
        queryKey: airworthinessDirectivesShowQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });
      toast.success('Aplicabilidad creada', {
        description: 'La aplicabilidad fue registrada correctamente.',
      });
    },
    onError: axiosErrorToast({
      title: 'Error al crear aplicabilidad',
      defaultDescription: 'No se pudo registrar la aplicabilidad.',
    }),
  });
};

export const useCreateAirworthinessDirectiveApplicabilitiesBulk = (directiveId: number | undefined) => {
  return useMutation({
    ...airworthinessDirectiveApplicabilitiesBulkStoreMutation(),
    onSuccess(data, variables, onMutateResult, { client }) {
      client.invalidateQueries({
        queryKey: airworthinessDirectiveApplicabilitiesIndexQueryKey({
          path: { directiveId: directiveId ?? 0 },
        }),
      });
      client.invalidateQueries({
        queryKey: airworthinessDirectivesShowQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });

      const createdCount = variables.body.applicabilities.length;

      toast.success(createdCount > 1 ? 'Aplicabilidades creadas' : 'Aplicabilidad creada', {
        description:
          createdCount > 1
            ? 'Las aplicabilidades fueron registradas correctamente.'
            : 'La aplicabilidad fue registrada correctamente.',
      });
    },
    onError: axiosErrorToast({
      title: 'Error al crear aplicabilidades',
      defaultDescription: 'No se pudieron registrar las aplicabilidades.',
    }),
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
        queryKey: airworthinessDirectivesShowQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });
      toast.success('Aplicabilidad actualizada', {
        description: 'La aplicabilidad fue actualizada correctamente.',
      });
    },
    onError: axiosErrorToast({
      title: 'Error al actualizar aplicabilidad',
      defaultDescription: 'No se pudo actualizar la aplicabilidad.',
    }),
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
        queryKey: airworthinessDirectivesShowQueryKey({
          path: { id: directiveId ?? 0 },
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
      toast.success('Aplicabilidad eliminada', {
        description: 'La aplicabilidad fue eliminada correctamente.',
      });
    },
    onError: axiosErrorToast({
      title: 'Error al eliminar aplicabilidad',
      defaultDescription: 'No se pudo eliminar la aplicabilidad.',
    }),
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
        queryKey: airworthinessDirectivesShowQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });
      toast.success('Control creado', {
        description: 'El control de cumplimiento fue registrado correctamente.',
      });
    },
    onError: axiosErrorToast({
      title: 'Error al crear control',
      defaultDescription: 'No se pudo registrar el control de cumplimiento.',
    }),
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
        queryKey: airworthinessDirectivesShowQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });
      toast.success('Control actualizado', {
        description: 'El control de cumplimiento fue actualizado correctamente.',
      });
    },
    onError: axiosErrorToast({
      title: 'Error al actualizar control',
      defaultDescription: 'No se pudo actualizar el control de cumplimiento.',
    }),
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
        queryKey: airworthinessDirectivesShowQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });
      toast.success('Control eliminado', {
        description: 'El control de cumplimiento fue eliminado correctamente.',
      });
    },
    onError: axiosErrorToast({
      title: 'Error al eliminar control',
      defaultDescription: 'No se pudo eliminar el control de cumplimiento.',
    }),
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
        queryKey: airworthinessDirectivesShowQueryKey({
          path: { id: directiveId ?? 0 },
        }),
      });
      toast.success('Cumplimiento registrado', {
        description: 'La ejecución fue registrada correctamente.',
      });
    },
    onError: axiosErrorToast({
      title: 'Error al registrar cumplimiento',
      defaultDescription: 'No se pudo registrar la ejecución de cumplimiento.',
    }),
  });
};
