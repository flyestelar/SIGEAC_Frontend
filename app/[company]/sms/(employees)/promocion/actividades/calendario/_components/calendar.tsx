"use client";
import { useUpdateCalendarSMSActivity } from "@/actions/sms/sms_actividades/actions";
import CreateSMSActivityDialog from "@/components/dialogs/sms/CreateSMSActivityDialog";
import { useCompanyStore } from "@/stores/CompanyStore";
import { AgendaView } from "./agenda-view";
import {
  createViewDay,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
import { createEventModalPlugin } from "@schedule-x/event-modal";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { ScheduleXCalendar, useNextCalendarApp } from "@schedule-x/react";
import { createResizePlugin } from "@schedule-x/resize";
import "@schedule-x/theme-default/dist/index.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClockIcon, NotebookIcon, PencilLine } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";

interface SMSActivities {
  id: number;
  title: string;
  start: string;
  end: string;
  description: string;
  calendarId: string;
  status: "ABIERTO" | "CERRADO" | "PENDIENTE"; // Asegúrate de que esta propiedad existe
}

type CalendarProps = {
  events: SMSActivities[];
  theme?: "dark" | "light";
};

const eventStatus = {
  // GREEN
  ABIERTO: {
    colorName: "abierto",
    lightColors: {
      main: "#2ADE99", // rojo fuerte
      container: "#B3FFCC",
      onContainer: "#000",
    },
    darkColors: {
      main: "#2ADE99", // rojo fuerte
      container: "#B3FFCC",
      onContainer: "#000",
    },
  },
  // RED
  CERRADO: {
    colorName: "cerrado",
    lightColors: {
      main: "#FF1A1A", //
      container: "#FFA8A8",
      onContainer: "#000",
    },
    darkColors: {
      main: "#FF1A1A",
      container: "#FA9B9B",
      onContainer: "#000",
    },
  },
  PENDIENTE: {
    colorName: "pendiente",
    lightColors: {
      main: "#10b981", // verde
      container: "#d1fae5",
      onContainer: "#064e3b",
    },
    darkColors: {
      main: "#6ee7b7",
      container: "#064e3b",
      onContainer: "#d1fae5",
    },
  },
};

export const Calendar = ({ events, theme = "light" }: CalendarProps) => {
  const { selectedCompany } = useCompanyStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const initialView =
    typeof window !== "undefined" && window.innerWidth < 768 ? "week" : "month";

  const eventsServiceRef = useRef(createEventsServicePlugin());
  const eventModal = useMemo(() => createEventModalPlugin(), []);
  const dragAndDrop = useMemo(() => createDragAndDropPlugin(), []);
  const resizePlugin = useMemo(() => createResizePlugin(30), []);

  const { updateCalendarSMSActivity } = useUpdateCalendarSMSActivity();

  // ✅ Esta llamada es correcta, fuera de useMemo
  const calendar = useNextCalendarApp({
    views: [createViewMonthGrid(), createViewWeek(), createViewDay()],
    calendars: eventStatus,
    events,
    locale: "es-ES",
    defaultView: initialView,
    isResponsive: true,
    plugins: [dragAndDrop, eventsServiceRef.current, eventModal, resizePlugin],
    dayBoundaries: { start: "06:00", end: "18:00" },
    callbacks: {
      onDoubleClickDate: (date: string) => {
        setSelectedDate(`${date} 0:00`);
        setIsDialogOpen(true);
      },
      onDoubleClickDateTime: (dateTime: string) => {
        setSelectedDate(dateTime);
        setIsDialogOpen(true);
      },
      onEventUpdate: async (event) => {
        const start_time = event.start.split(" ")[1];
        const end_time = event.end.split(" ")[1];
        try {
          await updateCalendarSMSActivity.mutateAsync({
            company: selectedCompany!.slug,
            id: event.id as string,
            data: {
              ...event,
              start_date: new Date(event.start),
              end_date: new Date(event.end),
              start_time: start_time,
              end_time: end_time,
              status: event.calendarId,
            },
          });
        } catch (error) {
          console.error("Error al actualizar el evento:", error);
        }
      },
    },
  });

  const customComponents = useMemo(
    () => ({
      eventModal: ({
        calendarEvent,
      }: {
        calendarEvent: SMSActivities;
        close: () => void;
      }) => {
        const startDate = new Date(calendarEvent.start);
        const endDate = new Date(calendarEvent.end);

        return (
          <div className="text-foreground p-3 sm:p-6 rounded-lg shadow-xl w-[min(92vw,28rem)] border border-border">
            <div className="flex gap-2 items-center mb-3 sm:mb-4">
              <PencilLine className="w-4 h-4 shrink-0" />
              <h3 className="text-base sm:text-xl font-semibold leading-tight line-clamp-2">
                {calendarEvent.title}
              </h3>
            </div>

            <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6">
              <div className="flex items-start text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0" />
                  <span className="leading-snug">
                    {`${format(startDate, "d MMM yyyy, H:mm", { locale: es })} – ${format(endDate, "d MMM yyyy, H:mm", { locale: es })}`}
                  </span>
                </div>
              </div>

              {calendarEvent.title && (
                <div className="flex items-start text-xs sm:text-sm">
                  <NotebookIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 mt-0.5 shrink-0" />
                  <span className="line-clamp-3">{calendarEvent.title}</span>
                </div>
              )}
            </div>
            {calendarEvent.description && (
              <div className="flex justify-center text-xs sm:text-sm text-muted-foreground">
                <span className="line-clamp-4">{calendarEvent.description}</span>
              </div>
            )}
          </div>
        );
      },
    }),
    [selectedCompany?.slug]
  );

  useEffect(() => {
    if (events && eventsServiceRef.current) {
      eventsServiceRef.current.set(events);
    }
  }, [events]);

  useEffect(() => {
    calendar?.setTheme(theme);
  }, [theme, calendar]);

  return (
    <div className="w-full min-h-[400px] h-[calc(100dvh-300px)] sm:h-[calc(100dvh-240px)] lg:h-[calc(100dvh-200px)] p-1 sm:p-4">
      {isMobile ? (
        <AgendaView
          events={events}
          onCreateEvent={(date) => {
            setSelectedDate(`${date} 0:00`);
            setIsDialogOpen(true);
          }}
        />
      ) : (
        <ScheduleXCalendar
          calendarApp={calendar}
          customComponents={customComponents}
        />
      )}
      <CreateSMSActivityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedDate}
      />
    </div>
  );
};
