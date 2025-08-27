import axios from "@/lib/axios";
import { useCompanyStore } from "@/stores/CompanyStore";
import { Employee } from "@/types";
import { useQuery } from "@tanstack/react-query";

const fetchEmployeesByDepartment = async (
  department_acronym: string,
  location?: string | null,
  company?: string
): Promise<Employee[]> => {
  const { data } = await axios.get(
    `/${company}/${location}/employees-by-department/${department_acronym}`
  );
  return data;
};

export const useGetEmployeesByDepartment = (
  department_acronym: string,
) => {
  const { selectedCompany, selectedStation } = useCompanyStore();
  return useQuery<Employee[], Error>({
    queryKey: ["employees-by-department", department_acronym, selectedCompany, selectedStation],
    queryFn: () =>
      fetchEmployeesByDepartment(department_acronym, selectedStation, selectedCompany?.slug),
    enabled: !!department_acronym && !!selectedCompany && !!selectedStation,
  });
};
