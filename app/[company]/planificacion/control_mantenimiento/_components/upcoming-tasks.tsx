"use client";

import { AlertCircle, Clock, Calendar, RotateCcw, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface UpcomingTask {
  id: number;
  code: string;
  description: string;
  intervalType: "FH" | "FC" | "Calendar";
  remaining: number;
  status: "critical" | "warning";
  dueDate?: string;
}

const intervalIcons: Record<UpcomingTask["intervalType"], React.ReactNode> = {
  FH: <Clock className="h-3 w-3" />,
  FC: <RotateCcw className="h-3 w-3" />,
  Calendar: <Calendar className="h-3 w-3" />,
};

const MOCK_UPCOMING_TASKS: UpcomingTask[] = [
  {
    id: 1,
    code: "TC-2024-001",
    description: "Inspección de tren de aterrizaje principal",
    intervalType: "FH",
    remaining: 12,
    status: "critical",
  },
  {
    id: 2,
    code: "TC-2024-015",
    description: "Revisión de sistema hidráulico",
    intervalType: "FC",
    remaining: 45,
    status: "critical",
  },
  {
    id: 3,
    code: "TC-2024-008",
    description: "Inspección de paneles de fuselaje",
    intervalType: "Calendar",
    remaining: 15,
    status: "warning",
    dueDate: "2026-04-11",
  },
  {
    id: 4,
    code: "TC-2024-022",
    description: "Revisión de motor - boroscopía",
    intervalType: "FH",
    remaining: 120,
    status: "warning",
  },
  {
    id: 5,
    code: "TC-2024-030",
    description: "Inspección de sistema de combustible",
    intervalType: "FC",
    remaining: 80,
    status: "warning",
  },
];

interface UpcomingTasksProps {
  tasks?: UpcomingTask[];
}

export function UpcomingTasks({ tasks = MOCK_UPCOMING_TASKS }: UpcomingTasksProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
          <AlertCircle className="h-4 w-4 text-warning" />
          Próximas Tareas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-300px)] px-6 pb-6">
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay tareas próximas a vencer
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    task.status === "critical"
                      ? "border-destructive/50 bg-destructive/5"
                      : "border-warning/50 bg-warning/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-primary">{task.code}</p>
                      <p className="mt-1 text-sm text-foreground line-clamp-1">
                        {task.description}
                      </p>
                    </div>
                    <Badge
                      className={
                        task.status === "critical"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-warning text-warning-foreground"
                      }
                    >
                      {task.status === "critical" ? "Crítico" : "Próximo"}
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                      {intervalIcons[task.intervalType]}
                      <span className="ml-1">{task.intervalType}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Restante:{" "}
                      <span
                        className={
                          task.status === "critical"
                            ? "text-destructive font-medium"
                            : "text-warning font-medium"
                        }
                      >
                        {task.remaining.toLocaleString()}{" "}
                        {task.intervalType === "Calendar" ? "días" : task.intervalType}
                      </span>
                    </span>
                  </div>

                  {task.dueDate && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span suppressHydrationWarning>
                        Vence: {new Date(task.dueDate).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}

            {tasks.length > 0 && (
              <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/10">
                Ver todas las tareas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
