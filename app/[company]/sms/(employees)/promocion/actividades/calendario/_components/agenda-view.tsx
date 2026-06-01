"use client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, ChevronRight, Clock } from "lucide-react";
import { useMemo, useState } from "react";

interface SMSActivities {
  id: number;
  title: string;
  start: string;
  end: string;
  description: string;
  calendarId: string;
  status: "ABIERTO" | "CERRADO" | "PENDIENTE";
}

const STATUS_STYLES = {
  ABIERTO: {
    dot: "bg-[#2ADE99]",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Abierto",
  },
  CERRADO: {
    dot: "bg-[#FF1A1A]",
    badge: "bg-red-50 text-red-700 border-red-200",
    label: "Cerrado",
  },
  PENDIENTE: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Pendiente",
  },
};

interface AgendaViewProps {
  events: SMSActivities[];
  onCreateEvent: (date: string) => void;
}

export function AgendaView({ events, onCreateEvent }: AgendaViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<SMSActivities | null>(null);
  const today = new Date();

  const grouped = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const groups: {
      dateKey: string;
      date: Date;
      monthLabel: string;
      showMonthHeader: boolean;
      events: SMSActivities[];
    }[] = [];

    let lastMonth = "";
    for (const event of sorted) {
      const date = new Date(event.start);
      const dateKey = format(date, "yyyy-MM-dd");
      const monthLabel = format(date, "MMMM yyyy", { locale: es });
      const existing = groups.find((g) => g.dateKey === dateKey);
      if (existing) {
        existing.events.push(event);
      } else {
        groups.push({
          dateKey,
          date,
          monthLabel,
          showMonthHeader: monthLabel !== lastMonth,
          events: [event],
        });
        lastMonth = monthLabel;
      }
    }

    return groups;
  }, [events]);

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-lg border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-sm font-semibold capitalize">
          {format(today, "MMMM yyyy", { locale: es })}
        </h2>
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={() => onCreateEvent(format(today, "yyyy-MM-dd"))}
        >
          <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
          Nueva actividad
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-16">
            <CalendarPlus className="w-10 h-10 opacity-30" />
            <p className="text-sm">No hay actividades registradas</p>
          </div>
        )}

        {grouped.map(({ dateKey, date, monthLabel, showMonthHeader, events: dayEvents }) => {
          const todayDay = isToday(date);

          return (
            <div key={dateKey}>
              {showMonthHeader && (
                <div className="px-4 py-2 bg-muted/50 border-b sticky top-0 z-10">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground capitalize">
                    {monthLabel}
                  </span>
                </div>
              )}

              <div className="flex border-b last:border-b-0">
                {/* Date column */}
                <div
                  className={cn(
                    "w-14 shrink-0 flex flex-col items-center justify-start pt-3 pb-2 border-r",
                    todayDay && "bg-primary/5"
                  )}
                >
                  <span className="text-[10px] uppercase text-muted-foreground font-medium">
                    {format(date, "EEE", { locale: es })}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-bold leading-none mt-0.5",
                      todayDay ? "text-primary" : "text-foreground"
                    )}
                  >
                    {format(date, "d")}
                  </span>
                </div>

                {/* Events column */}
                <div className="flex-1 py-1.5 px-2 space-y-1">
                  {dayEvents.map((event) => {
                    const styles = STATUS_STYLES[event.status] ?? STATUS_STYLES.PENDIENTE;
                    const startTime = format(new Date(event.start), "H:mm");
                    const endTime = format(new Date(event.end), "H:mm");

                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full text-left flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/60 active:bg-muted transition-colors"
                      >
                        <div className={cn("w-2 h-2 rounded-full shrink-0", styles.dot)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate leading-snug">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              {startTime} – {endTime}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Event detail bottom sheet */}
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[65vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <SheetHeader className="text-left pb-4 border-b">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0",
                      (STATUS_STYLES[selectedEvent.status] ?? STATUS_STYLES.PENDIENTE).dot
                    )}
                  />
                  <div className="min-w-0">
                    <SheetTitle className="text-base leading-snug">
                      {selectedEvent.title}
                    </SheetTitle>
                    <span
                      className={cn(
                        "inline-flex mt-1.5 text-xs px-2 py-0.5 rounded-full border font-medium",
                        (STATUS_STYLES[selectedEvent.status] ?? STATUS_STYLES.PENDIENTE).badge
                      )}
                    >
                      {(STATUS_STYLES[selectedEvent.status] ?? STATUS_STYLES.PENDIENTE).label}
                    </span>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                      Inicio
                    </p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedEvent.start), "d MMM yyyy", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selectedEvent.start), "H:mm")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                      Fin
                    </p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedEvent.end), "d MMM yyyy", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selectedEvent.end), "H:mm")}
                    </p>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                      Descripción
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
