import axiosInstance from "@/lib/axios";
import {
  ComponentArticle,
  ConsumableArticle,
  DispatchRequest,
  Request,
  VoluntaryReport,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface VoluntaryReportData {
  identification_date: Date;
  report_date: Date;
  danger_location: string;
  danger_area: string;
  description: string;
  possible_consequences: string;
  status: string;
  name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}
interface UpdateVoluntaryReportData {
  id: number;
  report_number: string;
  report_date: Date;
  identification_date: Date;
  danger_location: string;
  danger_area: string;
  description: string;
  possible_consequences: string;
  danger_identification_id: number;
  status: string;
  reporter_name?: string;
  reporter_last_name?: string;
  reporter_phone?: string;
  reporter_email?: string;
}

export const useCreateVoluntaryReport = () => {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationKey: ["voluntary-reports"],
    mutationFn: async (data: VoluntaryReportData) => {
      await axiosInstance.post("/transmandu/voluntary-reports", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voluntary-reports"] });
      toast.success("¡Creado!", {
        description: `El reporte voluntario ha sido creado correctamente.`,
      });
    },
    onError: (error) => {
      toast.error("Oops!", {
        description: "No se pudo crear el reporte...",
      });
      console.log(error);
    },
  });
  return {
    createVoluntaryReport: createMutation,
  };
};

export const useDeleteVoluntaryReport = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationKey: ["voluntary-reports"],
    mutationFn: async (id: number | string) => {
      await axiosInstance.delete(`/transmandu/voluntary-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["danger-identifications"] });
      queryClient.invalidateQueries({ queryKey: ["voluntary-reports"] });
      toast.success("¡Eliminado!", {
        description: `¡El reporte ha sido eliminada correctamente!`,
      });
    },
    onError: (e) => {
      toast.error("Oops!", {
        description: "¡Hubo un error al eliminar el reporte!",
      });
    },
  });

  return {
    deleteVoluntaryReport: deleteMutation,
  };
};

export const useUpdateVoluntaryReport = () => {
  const queryClient = useQueryClient();

  const updateVoluntaryReportMutation = useMutation({
    mutationKey: ["voluntary-reports"],
    mutationFn: async (data: UpdateVoluntaryReportData) => {
      await axiosInstance.patch(
        `/transmandu/voluntary-reports/${data.id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voluntary-reports"] });
      toast.success("¡Actualizado!", {
        description: `El reporte voluntario ha sido actualizado correctamente.`,
      });
    },
    onError: (error) => {
      toast.error("Oops!", {
        description: "No se pudo actualizar el reporte voluntario...",
      });
      console.log(error);
    },
  });
  return {
    updateVoluntaryReport: updateVoluntaryReportMutation,
  };
};
