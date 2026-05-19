import axiosInstance from "@/lib/axios";
import { isAxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DangerIdentificationData {
  company: string | null;
  id: string | number;
  reportType: string;
  data: {
    danger: string;
    current_defenses: string;
    risk_management_start_date: Date;
    sms_area_id?: number;
    description: string;
    possible_consequences: string;
    consequence_to_evaluate: string;
    root_cause_analysis: string;
    information_source_id: string;
  };
}

interface UpdateDangerIdentification {
  company: string | null;
  id: string;
  data: {
    current_defenses: string;
    risk_management_start_date: Date;
    danger: string;
    sms_area_id?: number;
    danger_type: string;
    description: string;
    possible_consequences: string;
    consequence_to_evaluate: string;
    root_cause_analysis: string;
    information_source_id: number | string;
  };
}

export const useCreateDangerIdentification = () => {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async ({
      company,
      reportType,
      id,
      data,
    }: DangerIdentificationData) => {
      const response = await axiosInstance.post(
        `/${company}/sms/danger-identifications/${reportType}/${id}`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (_,data) => {
      queryClient.invalidateQueries({ queryKey: ["danger-identifications", data.company] });
      queryClient.invalidateQueries({ queryKey: ["voluntary-reports"] });
      queryClient.invalidateQueries({ queryKey: ["voluntary-report"] });
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
      toast.success("¡Creado!", {
        description: ` La identificacion de peligro ha sido creado correctamente.`,
      });
    },
    onError: (error) => {
      toast.error("Oops!", {
        description: "No se pudo crear la identificacion de peligro...",
      });
      console.log(error);
    },
  });
  return {
    createDangerIdentification: createMutation,
  };
};

export const useDeleteDangerIdentification = () => {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async ({
      company,
      id,
    }: {
      company: string | null;
      id: string;
    }) => {
      await axiosInstance.delete(
        `/${company}/sms/danger-identifications/${id}`
      );
    },
    onSuccess: (_,data) => {
      queryClient.invalidateQueries({ queryKey: ["danger-identifications", data.company] });
      queryClient.invalidateQueries({ queryKey: ["voluntary-reports"] });
      queryClient.invalidateQueries({
        queryKey: ["danger-identification-by-id"],
      });
      toast.success("¡Eliminado!", {
        description: `¡La identificacion de peligro ha sido eliminada correctamente!`,
      });
    },
    onError: (e) => {
      toast.error("Oops!", {
        description: "¡Hubo un error al eliminar la identificacion de peligro!",
      });
    },
  });

  return {
    deleteDangerIdentification: deleteMutation,
  };
};

export const useDownloadDangerIdentificationPdf = () => {
  const downloadMutation = useMutation({
    mutationFn: async ({ company, id }: { company: string; id: number | string }) => {
      const response = await axiosInstance.get(
        `/${company}/sms/danger-identifications/${id}/pdf`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `identificacion-peligro-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("PDF generado", { description: "El reporte PDF se ha descargado correctamente." });
    },
    onError: (error) => {
      const message = isAxiosError(error)
        ? error.response?.data?.message ?? "No se pudo generar el PDF."
        : "No se pudo generar el PDF.";
      toast.error("Error", { description: message });
    },
  });
  return { downloadDangerIdentificationPdf: downloadMutation };
};

export const useUpdateDangerIdentification = () => {
  const queryClient = useQueryClient();

  const updateDangerIdentificationtMutation = useMutation({
    mutationKey: ["danger-identifications"],
    mutationFn: async ({ company, data, id }: UpdateDangerIdentification) => {
      await axiosInstance.patch(
        `/${company}/sms/danger-identifications/${id}`,
        data
      );
    },
    onSuccess: (_,data) => {
      queryClient.invalidateQueries({ queryKey: ["danger-identifications", data.company] });
      queryClient.invalidateQueries({ queryKey: ["danger-identification"] });
      toast.success("¡Actualizado!", {
        description: `La identificacion de peligro ha sido actualizada correctamente.`,
      });
    },
    onError: (error) => {
      toast.error("Oops!", {
        description: "No se pudo actualizar la identificacion de peligro...",
      });
      console.log(error);
    },
  });
  return {
    updateDangerIdentification: updateDangerIdentificationtMutation,
  };
};
