"use client";
import { ContentLayout } from "@/components/layout/ContentLayout";
import LoadingPage from "@/components/misc/LoadingPage";
import { useTheme } from "next-themes";

import { useEffect } from "react";
import { useGetSMSActivitiesForCalendar } from "@/hooks/sms/useGetSMSActivitiesForCalendar";
import { Calendar } from "./_components/calendar";

const CalendarServicesPage = () => {
  const { theme } = useTheme();

  const { data: events, isLoading, error } = useGetSMSActivitiesForCalendar();
  useEffect(() => {
    console.log("Eventos actualizados:", events);
  }, [events]);

  if (isLoading) return <LoadingPage  />; // Muestra un spinner

  if (error) return <div>Error al cargar eventos {error.message}</div>;
  
  return (
    <ContentLayout title="Planificación de Actividades SMS">
      <div className="flex flex-col text-center justify-center gap-1 sm:gap-2 mb-3 sm:mb-6 px-2">
        <h1 className="font-bold text-2xl sm:text-4xl md:text-5xl leading-tight">
          Calendario de Actividades SMS
        </h1>
        <p className="text-muted-foreground italic text-xs sm:text-sm">
          Aquí puede llevar un registro de todas las actividades de SMS
          registradas en el sistema.{" "}
          <span className="hidden sm:inline">
            <br />
            Puede crear o editar las actividades de ser necesarios.
          </span>
        </p>
      </div>
        <Calendar
          events={events || []}
          theme={theme === "dark" ? "dark" : "light"} // Pasa el tema dinámico
        />
    </ContentLayout>
  );
};

export default CalendarServicesPage;
