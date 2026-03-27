"use client";

import { AlertTriangle, Clock, Calendar, RotateCcw, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
  const criticalCount = tasks.filter((t) => t.status === "critical").length;

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Alertas
          {criticalCount > 0 && (
            <Badge className="ml-auto bg-destructive/90 text-destructive-foreground font-mono text-[10px] px-1.5">
              {criticalCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-340px)]">
          <div className="px-4 pb-4">
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Sin alertas activas
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task, i) => (
                  <div key={task.id}>
                    <div
                      className={`rounded-md border p-2.5 transition-colors ${
                        task.status === "critical"
                          ? "border-destructive/30 bg-destructive/5"
                          : "border-amber-500/20 bg-amber-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              task.status === "critical" ? "bg-destructive animate-pulse" : "bg-amber-500"
                            }`} />
                            <span className="font-mono text-[11px] font-medium text-primary truncate">
                              {task.code}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] leading-snug text-foreground/80 line-clamp-2 pl-3">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2 pl-3">
                        <Badge variant="outline" className="h-4 border-border/60 px-1 text-[9px] font-normal gap-0.5">
                          {intervalIcons[task.intervalType]}
                          {task.intervalType}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          <span className={`font-mono font-semibold ${
                            task.status === "critical" ? "text-destructive" : "text-amber-600 dark:text-amber-400"
                          }`}>
                            {task.remaining.toLocaleString()}
                          </span>
                          {" "}{task.intervalType === "Calendar" ? "días" : task.intervalType} restantes
                        </span>
                      </div>

                      {task.dueDate && (
                        <div className="mt-1.5 flex items-center gap-1 pl-3 text-[10px] text-muted-foreground">
                          <Calendar className="h-2.5 w-2.5" />
                          <span suppressHydrationWarning>
                            {new Date(task.dueDate).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tasks.length > 0 && (
              <>
                <Separator className="my-3" />
                <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-primary hover:text-primary hover:bg-primary/5">
                  Ver todas las alertas
                  <ArrowRight className="ml-1.5 h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
