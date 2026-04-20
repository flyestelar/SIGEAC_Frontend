import {
  aircraftComponentSlotIndexQueryKey,
  aircraftComponentSlotStoreMutation,
  hardTimeComponentIndexQueryKey,
} from '@api/queries';
import {
  hardTimeComplianceStore,
  hardTimeComponentDestroy,
  hardTimeComponentStore,
  hardTimeInstallationInstall,
  hardTimeInstallationUninstall,
  hardTimeIntervalStore,
  hardTimeIntervalToggle,
  hardTimeIntervalUpdate,
} from '@api/sdk.gen';
import {
  InstallComponentRequest,
  StoreComplianceRequest,
  StoreComponentRequest,
  StoreIntervalRequest,
  UninstallComponentRequest,
  UpdateIntervalRequest,
} from '@api/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const hardTimeComponentsQueryKey = (aircraftId: number | null) => ['hard-time-components', aircraftId];
export const hardTimeComponentDetailQueryKey = (componentId: number) => ['hard-time-component-detail', componentId];

export type HardTimeImportStructureComponentInput = {
  part_number: string;
  description: string;
  position: string;
  ata_chapter?: string;
  intervals: StoreIntervalRequest[];
};

export type HardTimeImportStructureRequest = {
  aircraft_id: number;
  category_code: string;
  components: HardTimeImportStructureComponentInput[];
};

export const useInstallHardTimeComponent = (componentId: number, aircraftId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InstallComponentRequest) =>
      hardTimeInstallationInstall({
        path: { id: componentId },
        body: data,
        throwOnError: true,
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hardTimeComponentsQueryKey(aircraftId) });
      queryClient.invalidateQueries({ queryKey: hardTimeComponentDetailQueryKey(componentId) });
      toast.success('Componente montado', { description: 'El componente fue instalado correctamente.' });
    },
    onError: () => toast.error('No se pudo montar el componente'),
  });
};

export const useUninstallHardTimeComponent = (componentId: number, aircraftId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UninstallComponentRequest) =>
      hardTimeInstallationUninstall({
        path: { id: componentId },
        body: data,
        throwOnError: true,
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hardTimeComponentsQueryKey(aircraftId) });
      queryClient.invalidateQueries({ queryKey: hardTimeComponentDetailQueryKey(componentId) });
      toast.success('Componente desmontado', { description: 'El componente fue removido correctamente.' });
    },
    onError: () => toast.error('No se pudo desmontar el componente'),
  });
};

export const useRegisterHardTimeCompliance = (componentId: number, aircraftId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: StoreComplianceRequest) =>
      hardTimeComplianceStore({
        path: { componentId },
        body: data,
        throwOnError: true,
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hardTimeComponentsQueryKey(aircraftId) });
      queryClient.invalidateQueries({ queryKey: hardTimeComponentDetailQueryKey(componentId) });
      toast.success('Cumplimiento registrado');
    },
    onError: () => toast.error('No se pudo registrar el cumplimiento'),
  });
};

export const useCreateHardTimeInterval = (componentId: number, aircraftId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: StoreIntervalRequest) =>
      hardTimeIntervalStore({
        path: { componentId },
        body: data,
        throwOnError: true,
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hardTimeComponentsQueryKey(aircraftId) });
      queryClient.invalidateQueries({ queryKey: hardTimeComponentDetailQueryKey(componentId) });
      toast.success('Intervalo creado');
    },
    onError: () => toast.error('No se pudo crear el intervalo'),
  });
};

export const useUpdateHardTimeInterval = (intervalId: number, componentId: number, aircraftId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateIntervalRequest) =>
      hardTimeIntervalUpdate({
        path: { id: intervalId },
        body: data,
        throwOnError: true,
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hardTimeComponentsQueryKey(aircraftId) });
      queryClient.invalidateQueries({ queryKey: hardTimeComponentDetailQueryKey(componentId) });
      toast.success('Intervalo actualizado');
    },
    onError: () => toast.error('No se pudo actualizar el intervalo'),
  });
};

export const useToggleHardTimeInterval = (intervalId: number, componentId: number, aircraftId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      hardTimeIntervalToggle({
        path: { id: intervalId },
        throwOnError: true,
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hardTimeComponentsQueryKey(aircraftId) });
      queryClient.invalidateQueries({ queryKey: hardTimeComponentDetailQueryKey(componentId) });
      toast.success('Intervalo actualizado');
    },
    onError: () => toast.error('No se pudo actualizar el intervalo'),
  });
};

export const useCreateHardTimeComponent = (aircraftId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...aircraftComponentSlotStoreMutation(),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aircraftComponentSlotIndexQueryKey({ query: { aircraft_id: aircraftId! } }),
      });
      queryClient.invalidateQueries({
        queryKey: hardTimeComponentIndexQueryKey({ query: { aircraft_id: aircraftId! } }),
      });
      toast.success('Componente controlado creado');
    },
    onError: () => toast.error('No se pudo crear el componente'),
  });
};

export const useDeleteHardTimeComponent = (aircraftId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (componentId: number) =>
      hardTimeComponentDestroy({
        path: { id: componentId },
        throwOnError: true,
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hardTimeComponentsQueryKey(aircraftId) });
      toast.success('Componente eliminado');
    },
    onError: () => toast.error('No se pudo eliminar el componente'),
  });
};

export const useImportHardTimeStructure = (aircraftId: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HardTimeImportStructureRequest) => {
      const importedComponentIds: number[] = [];

      for (const component of data.components) {
        const componentPayload: StoreComponentRequest = {
          aircraft_id: data.aircraft_id,
          category_code: data.category_code,
          part_number: component.part_number,
          description: component.description,
          position: component.position,
          ata_chapter: component.ata_chapter,
        };

        const componentResponse = await hardTimeComponentStore({
          body: componentPayload,
          throwOnError: true,
        }).then((res) => res.data);

        const componentId = componentResponse.component.id;
        importedComponentIds.push(componentId);

        for (const interval of component.intervals) {
          await hardTimeIntervalStore({
            path: { componentId },
            body: interval,
            throwOnError: true,
          });
        }
      }

      return {
        imported_components: importedComponentIds.length,
        imported_intervals: data.components.reduce((total, component) => total + component.intervals.length, 0),
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: hardTimeComponentsQueryKey(aircraftId) });
      toast.success('Importación completada', {
        description: `${result.imported_components} componentes y ${result.imported_intervals} intervalos creados.`,
      });
    },
    onError: () =>
      toast.error('No se pudo completar la importación', {
        description: 'Se importan sólo posiciones e intervalos. El histórico de cumplimiento sigue fuera de esta fase.',
      }),
  });
};
