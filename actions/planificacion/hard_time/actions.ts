import axiosInstance from '@/lib/axios';
import {
  HardTimeCreateComponentData,
  HardTimeCreateIntervalData,
  HardTimeInstallComponentData,
  HardTimeRegisterComplianceData,
  HardTimeUninstallComponentData,
} from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const hardTimeComponentsQueryKey = (aircraftId: number | null) => ['hard-time-components', aircraftId];
export const hardTimeComponentDetailQueryKey = (componentId: number) => ['hard-time-component-detail', componentId];

export const useInstallHardTimeComponent = (componentId: number, aircraftId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: HardTimeInstallComponentData) =>
      (await axiosInstance.post(`/hard-time-components/${componentId}/install`, data)).data,
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
    mutationFn: async (data: HardTimeUninstallComponentData) =>
      (await axiosInstance.post(`/hard-time-components/${componentId}/uninstall`, data)).data,
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
    mutationFn: async (data: HardTimeRegisterComplianceData) =>
      (await axiosInstance.post(`/hard-time-components/${componentId}/compliances`, data)).data,
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
    mutationFn: async (data: HardTimeCreateIntervalData) =>
      (await axiosInstance.post(`/hard-time-components/${componentId}/intervals`, data)).data,
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
    mutationFn: async (data: HardTimeCreateIntervalData) =>
      (await axiosInstance.put(`/hard-time-intervals/${intervalId}`, data)).data,
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
    mutationFn: async () => (await axiosInstance.patch(`/hard-time-intervals/${intervalId}/toggle`)).data,
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
    mutationFn: async (data: HardTimeCreateComponentData) =>
      (await axiosInstance.post('/hard-time-components', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hardTimeComponentsQueryKey(aircraftId) });
      toast.success('Componente controlado creado');
    },
    onError: () => toast.error('No se pudo crear el componente'),
  });
};

export const useDeleteHardTimeComponent = (aircraftId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (componentId: number) =>
      (await axiosInstance.delete(`/hard-time-components/${componentId}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hardTimeComponentsQueryKey(aircraftId) });
      toast.success('Componente eliminado');
    },
    onError: () => toast.error('No se pudo eliminar el componente'),
  });
};
