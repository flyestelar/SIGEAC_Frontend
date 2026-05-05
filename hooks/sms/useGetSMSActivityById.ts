import axiosInstance from "@/lib/axios";
import { SmsActivityResource } from "@/.gen/api/types.gen";
import { useQuery } from "@tanstack/react-query";

const fetchSMSActivityById = async ({
  company,
  id,
}: {
  company: string | null | undefined;
  id: string;
}) => {
  const { data } = await axiosInstance.get(`/${company}/sms/activities/${id}`);
  return data;
};

export const useGetSMSActivityById = ({
  company,
  id,
}: {
  company: string | null | undefined;
  id: string;
}) => {
  return useQuery<SmsActivityResource>({
    queryKey: ["sms-activity", id], // Incluye el ID en la clave de la query
    queryFn: () => fetchSMSActivityById({ company, id }), // Pasa el ID a la función fetchUser
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!company,
  });
};
