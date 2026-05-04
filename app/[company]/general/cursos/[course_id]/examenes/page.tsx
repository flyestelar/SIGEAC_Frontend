"use client";

import { ContentLayout } from "@/components/layout/ContentLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetCourseAttendanceList } from "@/hooks/curso/useGetCourseAttendanceList";
import { useGetCourseExams } from "@/hooks/curso/useGetCourseExams";
import { useGetCourseById } from "@/hooks/curso/useGetCourseById";
import { useCompanyStore } from "@/stores/CompanyStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileText,
  Loader2,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const ManageExamsPage = () => {
  const { course_id } = useParams<{ course_id: string }>();
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();
  const [selectedExamId, setSelectedExamId] = useState<string>("");

  const {
    data: course,
    isLoading: isCourseLoading,
  } = useGetCourseById({ id: course_id, company: selectedCompany?.slug });

  const {
    data: exams,
    isLoading: isExamsLoading,
    isError: isExamsError,
  } = useGetCourseExams({ course_id, company: selectedCompany?.slug });

  const {
    data: attendanceList,
    isLoading: isAttendanceListLoading,
    isError: isAttendanceListError,
  } = useGetCourseAttendanceList({ course_id, company: selectedCompany?.slug });

  const selectedExam = exams?.find((exam) => exam.id.toString() === selectedExamId);

  return (
    <ContentLayout title="Gestionar Exámenes">
      <div className="w-full border border-gray-300 rounded-lg p-6 shadow-md dark:border-gray-700 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Gestión de Exámenes
              </h1>
              <p className="text-sm text-muted-foreground">
                {course ? course.name : "Cargando curso..."}
              </p>
            </div>
          </div>
        </div>

        {isExamsLoading ? (
          <div className="flex w-full h-32 justify-center items-center">
            <Loader2 className="size-8 animate-spin text-blue-500" />
          </div>
        ) : isExamsError ? (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-gray-300">
              Error al cargar los exámenes del curso.
            </p>
          </div>
        ) : exams && exams.length > 0 ? (
          <div className="space-y-6">
            <div className="border dark:bg-gray-800 p-5 rounded-lg flex flex-col gap-4">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Seleccione el examen a gestionar:
              </label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="w-full md:w-[400px]">
                  <SelectValue placeholder="Seleccionar Examen" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>
                      {exam.name} - {format(new Date(exam.exam_date), "dd/MM/yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedExam && (
              <div className="border border-gray-300 dark:bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Resultados de los Empleados
                  </h2>
                  <Badge>{attendanceList?.length || 0} inscritos</Badge>
                </div>

                {isAttendanceListLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-8 animate-spin text-blue-500" />
                  </div>
                ) : isAttendanceListError ? (
                  <div className="border dark:bg-red-900/20 border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700 dark:text-gray-300">
                      Error al cargar la lista de empleados inscritos
                    </p>
                  </div>
                ) : attendanceList && attendanceList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Empleado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Calificación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Aprobado
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {attendanceList.map((attendance) => {
                          return (
                            <tr key={attendance.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                <div className="flex flex-col">
                                  <span>{attendance.employee.first_name} {attendance.employee.last_name}</span>
                                  <span className="text-xs text-muted-foreground">{attendance.employee_dni}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Input type="number" placeholder="Ej: 85" className="w-24" />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Switch />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <Button size="sm">Guardar</Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay empleados inscritos en este curso
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              Aún no hay exámenes registrados para este curso.
            </p>
          </div>
        )}
      </div>
    </ContentLayout>
  );
};

export default ManageExamsPage;
