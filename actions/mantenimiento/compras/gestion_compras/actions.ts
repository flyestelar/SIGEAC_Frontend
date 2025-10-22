import axiosInstance from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface IUpdateArticleData {
  article_id: number;
  new_cost?: number;
}

export const useUpdateArticleCost = () => {
  const queryClient = useQueryClient();

  const updateArticleCostMutation = useMutation({
    mutationKey: ["update-article-cost"],
    mutationFn: async ({
      company,
      updates
    }: {
      updates: IUpdateArticleData[];
      company: string;
    }) => {
      await axiosInstance.patch(`/${company}/update-article-cost`, {
        updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      toast.success("¡Actualizado!", {
        description: "Las cantidades y ubicaciones han sido actualizadas correctamente."
      });
    },
    onError: (error) => {
      toast('Hey', {
        description: `No se actualizó correctamente: ${error}`
      })
    },
  });

  return {
    updateArticleCost: updateArticleCostMutation,
  };
};
