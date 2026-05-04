"use client";

import { Clock, Calendar, RotateCcw, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TaskCardResource } from "@api/types";

interface TasksTableProps {
  tasks: TaskCardResource[]|null|undefined;
  controlName: string;
}

export function TasksTable({ tasks, controlName }: TasksTableProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <Card className="border-border/60 bg-card">
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Sin task cards registradas
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Este control no tiene tareas de mantenimiento asignadas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <ClipboardList className="h-4 w-4 text-primary" />
          Task Cards
          <span className="font-normal normal-case tracking-normal text-foreground">
            — {controlName}
          </span>
        </CardTitle>
        <Badge variant="secondary" className="font-mono text-xs">
          {tasks.length}
        </Badge>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <ScrollArea className="h-[calc(100vh-480px)]">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[180px] pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tarea
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Descripción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className="group border-border/40 hover:bg-muted/30">
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="whitespace-nowrap font-mono text-xs font-medium text-primary">
                        {task.new_task || task.old_task}
                      </span>
                      {task.new_task && task.old_task && task.new_task !== task.old_task && (
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          ({task.old_task})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-foreground">
                      {task.description}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
