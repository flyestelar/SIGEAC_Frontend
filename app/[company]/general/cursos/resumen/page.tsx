"use client";

import { useState } from "react";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useCompanyStore } from "@/stores/CompanyStore";
import { useGetEmployeesList } from "@/hooks/sms/useGetCertificates";
import { useGetEmployeeTrainingProfile } from "@/hooks/curso/useGetEmployeeTrainingProfile";
import { Loader2, Users, FileText, CheckCircle, XCircle, Search, FileBadge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const EmployeeProfileSheet = ({
  isOpen,
  onClose,
  employeeDni,
  employeeName,
}: {
  isOpen: boolean;
  onClose: () => void;
  employeeDni: string;
  employeeName: string;
}) => {
  const { selectedCompany } = useCompanyStore();
  const { data: profile, isLoading, isError } = useGetEmployeeTrainingProfile(
    selectedCompany?.slug,
    employeeDni
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Perfil de Capacitación
          </SheetTitle>
          <SheetDescription>
            Resumen de certificaciones y exámenes de <strong>{employeeName}</strong>
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex w-full h-40 justify-center items-center">
            <Loader2 className="size-10 animate-spin text-blue-500" />
          </div>
        ) : isError ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">
            Ha ocurrido un error al cargar el perfil del empleado.
          </div>
        ) : profile ? (
          <div className="space-y-8">
            {/* Certificados */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                <FileBadge className="w-5 h-5 text-amber-500" />
                Certificados ({profile.certificates?.length || 0})
              </h3>
              {profile.certificates && profile.certificates.length > 0 ? (
                <div className="grid gap-3">
                  {profile.certificates.map((cert: any, i: number) => (
                    <div key={i} className="border p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="font-semibold">{cert.course_name || "Curso"}</p>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Emisión: {format(new Date(cert.issue_date || cert.created_at), "dd/MM/yyyy")}</span>
                        {cert.expiration_date && (
                          <span className="text-red-500">Expira: {format(new Date(cert.expiration_date), "dd/MM/yyyy")}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No hay certificados registrados.</p>
              )}
            </div>

            {/* Exámenes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Exámenes ({profile.exams?.length || 0})
              </h3>
              {profile.exams && profile.exams.length > 0 ? (
                <div className="grid gap-3">
                  {profile.exams.map((exam: any, i: number) => (
                    <div key={i} className="border p-3 rounded-lg flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <p className="font-semibold">{exam.exam_name || "Examen"}</p>
                        <p className="text-sm text-muted-foreground">Nota: {exam.score || "N/A"}</p>
                      </div>
                      <div>
                        {exam.approved ? (
                          <Badge className="bg-green-500 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Aprobado
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Reprobado
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No hay exámenes registrados.</p>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

const ResumenCapacitacionPage = () => {
  const { selectedCompany } = useCompanyStore();
  const { data: employees, isLoading, isError } = useGetEmployeesList(selectedCompany?.slug);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<{dni: string, name: string} | null>(null);

  const filteredEmployees = employees?.filter((emp: any) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const dni = emp.dni?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || dni.includes(search);
  });

  return (
    <ContentLayout title="Resumen de Capacitaciones">
      <div className="flex flex-col gap-6 w-full border border-gray-300 rounded-lg p-6 shadow-md dark:border-gray-700 bg-white dark:bg-gray-900">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-6 dark:border-gray-800">
          <div className="flex items-center gap-3 w-full">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Resumen General de Empleados
              </h1>
              <p className="text-sm text-muted-foreground">
                Selecciona un empleado para ver su historial de certificados y exámenes.
              </p>
            </div>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre o DNI..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex w-full h-48 justify-center items-center">
            <Loader2 className="size-12 animate-spin text-blue-500" />
          </div>
        ) : isError ? (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-gray-300">
              Error al cargar la lista de empleados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    DNI
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredEmployees && filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp: any) => (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEmployee({
                        dni: emp.dni, 
                        name: `${emp.first_name} ${emp.last_name}`
                      })}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                            {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {emp.first_name} {emp.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {emp.email || "Sin correo"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {emp.dni}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          Ver Resumen
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron empleados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal/Drawer de Resumen */}
        {selectedEmployee && (
          <EmployeeProfileSheet
            isOpen={!!selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            employeeDni={selectedEmployee.dni}
            employeeName={selectedEmployee.name}
          />
        )}
      </div>
    </ContentLayout>
  );
};

export default ResumenCapacitacionPage;
