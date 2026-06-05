'use client';

import { ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TaskCardResource } from '@api/types';

interface TasksTableProps {
  tasks: TaskCardResource[] | null | undefined;
  controlName: string;
}

export function TasksTable({ tasks, controlName }: TasksTableProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <Card className="border-border/60 bg-card">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <ClipboardList className="h-5 w-5 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-foreground/80">Sin task cards registradas</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Este control no tiene tareas de mantenimiento asignadas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <ClipboardList className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Task Cards
          </span>
          <span className="truncate text-sm font-medium text-foreground/80">{controlName}</span>
        </div>
        <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <CardContent className="px-0 pb-0">
        <ScrollArea className="h-[calc(100vh-480px)]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/50">
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="w-[200px] pl-6 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Tarea
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Descripción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="group border-l-2 border-transparent border-b-border/40 transition-colors hover:border-l-primary/40 hover:bg-muted/30"
                >
                  <TableCell className="pl-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="whitespace-nowrap font-mono text-xs font-semibold text-primary">
                        {task.new_task || task.old_task}
                      </span>
                      {task.new_task && task.old_task && task.new_task !== task.old_task && (
                        <span className="font-mono text-[10px] text-muted-foreground/70">
                          ant. {task.old_task}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground/80">{task.description}</span>
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
