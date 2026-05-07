import axiosInstance from "@/lib/axios";
import { isAxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MitigationPlanData {
  company: string | null;
  data: {
    description: string;
    responsible: string;
    start_date: Date;
    danger_identification_id: number;
  };
}

interface UpdateMitigationPlanData {
  company: string | null;
  id: string;
  data: {
    description: string;
    responsible: string;
    start_date: Date;
  };
}

interface updateStatus {
  company: string | null;
  data: {
    mitigation_id: number | string;
    result: string;
    close_date?: string; // Agregamos la fecha de cierre
  };
}
export const useCreateMitigationPlan = () => {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    //    mutationKey: ["danger-identifications/${id}"],
    mutationFn: async ({ data, company }: MitigationPlanData) => {
      await axiosInstance.post(`/${company}/sms/mitigation-plans`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mitigation-plans"] });
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
      toast.success("¡Creado!", {
        description: ` El plan de mitigacion ha sido creado correctamente.`,
      });
    },
    onError: (error) => {
      const message = isAxiosError(error)
        ? error.response?.data?.message ?? "No se pudo crear el plan de mitigación."
        : "No se pudo crear el plan de mitigación.";
      toast.error("Error", { description: message });
    },
  });
  return {
    createMitigationPlan: createMutation,
  };
};

export const useDeleteMitigationPlan = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({
      company,
      id,
    }: {
      company: string | null;
      id: string;
    }) => {
      await axiosInstance.delete(`/${company}/sms/mitigation-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mitigation-plans"] });
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
      toast.success("¡Eliminado!", {
        description: `¡El plan de mitigacion ha sido eliminada correctamente!`,
      });
    },
    onError: (error) => {
      const message = isAxiosError(error)
        ? error.response?.data?.message ?? "No se pudo eliminar el plan de mitigación."
        : "No se pudo eliminar el plan de mitigación.";
      toast.error("Error", { description: message });
    },
  });

  return {
    deleteMitigationPlan: deleteMutation,
  };
};

export const useUpdateMitigationPlan = () => {
  const queryClient = useQueryClient();

  const updateMitigationPlanMutation = useMutation({
    mutationKey: ["mitigation-plans"],
    mutationFn: async ({ data, id, company }: UpdateMitigationPlanData) => {
      await axiosInstance.patch(`/${company}/sms/mitigation-plans/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
      toast.success("¡Actualizado!", {
        description: `El plan de mitigacion ha sido actualizada correctamente.`,
      });
    },
    onError: (error) => {
      const message = isAxiosError(error)
        ? error.response?.data?.message ?? "No se pudo actualizar el plan de mitigación."
        : "No se pudo actualizar el plan de mitigación.";
      toast.error("Error", { description: message });
    },
  });
  return {
    updateMitigationPlan: updateMitigationPlanMutation,
  };
};

export const useCloseReport = () => {
  const queryClient = useQueryClient();
  const closeReportMutation = useMutation({
    mutationKey: ["close-report"],
    mutationFn: async ({ data, company }: updateStatus) => {
      await axiosInstance.patch(
        `/${company}/sms/close-report/${data.mitigation_id}`,
        data
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mitigation-plans"] });
      queryClient.invalidateQueries({ queryKey: ["voluntary-reports"] });
      queryClient.invalidateQueries({ queryKey: ["obligatory-reports"] });
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
      toast.success("Reporte Cerrado!", {
        description: `Se ha cerrado el reporte correctamente.`,
      });
    },
    onError: (error) => {
      const message = isAxiosError(error)
        ? error.response?.data?.message ?? "No se pudo cerrar el reporte."
        : "No se pudo cerrar el reporte.";
      toast.error("Error", { description: message });
    },
  });
  return {
    closeReportByMitigationId: closeReportMutation,
  };
};

export const useOpenReport = () => {
  const queryClient = useQueryClient();
  const openReportMutation = useMutation({
    mutationKey: ["open-report"],
    mutationFn: async ({ data, company }: updateStatus) => {
      await axiosInstance.patch(
        `/${company}/sms/open-report/${data.mitigation_id}`,
        data
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mitigation-plans"] });
      queryClient.invalidateQueries({ queryKey: ["voluntary-reports"] });
      queryClient.invalidateQueries({ queryKey: ["obligatory-reports"] });
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
      toast.success("Reporte Abierto!", {
        description: `Se ha abierto el reporte correctamente.`,
      });
    },
    onError: (error) => {
      const message = isAxiosError(error)
        ? error.response?.data?.message ?? "No se pudo abrir el reporte."
        : "No se pudo abrir el reporte.";
      toast.error("Error", { description: message });
    },
  });
  return {
    openReportByMitigationId: openReportMutation,
  };
};