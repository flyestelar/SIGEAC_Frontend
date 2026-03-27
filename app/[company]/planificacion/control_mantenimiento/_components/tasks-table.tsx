"use client";

import { Clock, Calendar, Gauge, RotateCcw, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MaintenanceTask, IntervalType } from "../_data/types";

interface TasksTableProps {
  tasks: MaintenanceTask[];
  controlName: string;
}

const intervalIcons: Record<IntervalType, React.ReactNode> = {
  FH: <Clock className="h-3 w-3" />,
  FC: <RotateCcw className="h-3 w-3" />,
  Calendar: <Calendar className="h-3 w-3" />,
  Interval: <Gauge className="h-3 w-3" />,
};

const intervalLabels: Record<IntervalType, string> = {
  FH: "Flight Hours",
  FC: "Flight Cycles",
  Calendar: "Calendario",
  Interval: "Intervalo",
};

function getStatusBadge(status: MaintenanceTask["status"]) {
  switch (status) {
    case "critical":
      return (
        <Badge className="bg-destructive text-destructive-foreground">
          Crítico
        </Badge>
      );
    case "warning":
      return (
        <Badge className="bg-warning text-warning-foreground">
          Próximo
        </Badge>
      );
    case "ok":
      return (
        <Badge className="bg-success text-success-foreground">
          OK
        </Badge>
      );
  }
}

function getProgressPercentage(task: MaintenanceTask) {
  return Math.round((task.currentValue / task.intervalValue) * 100);
}

function getProgressColor(percentage: number) {
  if (percentage >= 95) return "bg-destructive";
  if (percentage >= 80) return "bg-warning";
  return "bg-primary";
}

export function TasksTable({ tasks, controlName }: TasksTableProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-medium text-foreground">
          Tareas de Mantenimiento
        </CardTitle>
        <Badge variant="outline" className="border-border text-muted-foreground">
          {tasks.length} tareas
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">Código</TableHead>
                <TableHead className="text-muted-foreground">Descripción</TableHead>
                <TableHead className="text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-muted-foreground">Intervalo</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const progress = getProgressPercentage(task);
                return (
                  <TableRow key={task.id} className="border-border hover:bg-secondary/30">
                    <TableCell className="font-mono text-sm text-primary">
                      {task.code}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <span className="line-clamp-2 text-sm text-foreground">
                        {task.description}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-border bg-muted text-muted-foreground"
                      >
                        {intervalIcons[task.intervalType]}
                        <span className="ml-1">{task.intervalType}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex flex-col">
                        <span>
                          {task.currentValue.toLocaleString()} / {task.intervalValue.toLocaleString()}
                        </span>
                        <span className="text-xs">
                          {intervalLabels[task.intervalType]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                          <DropdownMenuItem>Registrar cumplimiento</DropdownMenuItem>
                          <DropdownMenuItem>Editar tarea</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
