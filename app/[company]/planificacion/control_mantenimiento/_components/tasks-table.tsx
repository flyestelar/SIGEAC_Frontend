"use client";

import { Clock, Calendar, RotateCcw, MoreHorizontal } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TaskCard } from "@/types";

interface TasksTableProps {
  tasks: TaskCard[];
  controlName: string;
}

export function TasksTable({ tasks, controlName }: TasksTableProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-medium text-foreground">
          Tareas - {controlName}
        </CardTitle>
        <Badge variant="outline" className="border-border text-muted-foreground">
          {tasks.length} tareas
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-secondary/50 hover:bg-secondary/50">
                  <TableHead className="text-muted-foreground">Tarea</TableHead>
                  <TableHead className="text-muted-foreground">Descripción</TableHead>
                  <TableHead className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} className="border-border hover:bg-secondary/30">
                    <TableCell className="font-mono text-sm text-primary">
                      <div className="flex flex-col">
                        <span>{task.new_task || task.old_task}</span>
                        {task.new_task && task.old_task && task.new_task !== task.old_task && (
                          <span className="text-xs text-muted-foreground">
                            ({task.old_task})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <span className="line-clamp-2 text-sm text-foreground">
                        {task.description}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {`${task.interval_fh} h`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.interval_fc || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.interval_days || '-'}
                    </TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
