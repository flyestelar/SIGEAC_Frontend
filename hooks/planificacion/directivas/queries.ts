import {
    airworthinessDirectivesApplicabilitiesOptions,
    airworthinessDirectivesComplianceControlsOptions,
    airworthinessDirectivesComplianceRecordsOptions,
    airworthinessDirectivesIndexOptions,
    airworthinessDirectivesIndexQueryKey,
    airworthinessDirectivesShowOptions,
    airworthinessDirectivesStoreMutation,
} from '@api/queries';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
    ...airworthinessDirectivesApplicabilitiesOptions({
      path: { id: id ?? 0 },
    }),
    enabled: !!id,
  });
};

export const useGetAirworthinessDirectiveComplianceControls = (id: number | undefined) => {
  return useQuery({
    ...airworthinessDirectivesComplianceControlsOptions({
      path: { id: id ?? 0 },
    }),
    enabled: !!id,
  });
};

export const useGetAirworthinessDirectiveComplianceRecords = (id: number | undefined) => {
  return useQuery({
    ...airworthinessDirectivesComplianceRecordsOptions({
      path: { id: id ?? 0 },
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