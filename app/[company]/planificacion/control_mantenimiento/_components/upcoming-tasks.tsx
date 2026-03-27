"use client";

import { AlertCircle, Clock, Calendar, RotateCcw, Gauge, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MaintenanceTask, IntervalType } from "../_data/types";

interface UpcomingTasksProps {
  tasks: MaintenanceTask[];
}

const intervalIcons: Record<IntervalType, React.ReactNode> = {
  FH: <Clock className="h-3 w-3" />,
  FC: <RotateCcw className="h-3 w-3" />,
  Calendar: <Calendar className="h-3 w-3" />,
  Interval: <Gauge className="h-3 w-3" />,
};

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const upcomingTasks = tasks
    .filter((t) => t.status === "critical" || t.status === "warning")
    .sort((a, b) => {
      if (a.status === "critical" && b.status !== "critical") return -1;
      if (b.status === "critical" && a.status !== "critical") return 1;
      return (a.currentValue / a.intervalValue) - (b.currentValue / b.intervalValue);
    })
    .slice(0, 5);

  const remaining = (task: MaintenanceTask) => {
    return task.intervalValue - task.currentValue;
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
          <AlertCircle className="h-4 w-4 text-warning" />
          Próximas Tareas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay tareas próximas a vencer
          </p>
        ) : (
          upcomingTasks.map((task) => (
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
                  Restante: <span className={task.status === "critical" ? "text-destructive font-medium" : "text-warning font-medium"}>
                    {remaining(task).toLocaleString()} {task.intervalType === "Calendar" || task.intervalType === "Interval" ? "días" : task.intervalType}
                  </span>
                </span>
              </div>

              {task.dueDate && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span suppressHydrationWarning>Vence: {new Date(task.dueDate).toLocaleDateString("es-AR")}</span>
                </div>
              )}
            </div>
          ))
        )}

        {upcomingTasks.length > 0 && (
          <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/10">
            Ver todas las tareas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
