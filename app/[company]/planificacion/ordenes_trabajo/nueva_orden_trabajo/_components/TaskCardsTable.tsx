'use client';

import { TaskCardResource } from '@api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardRow {
  controlTitle: string;
  controlId: number;
  taskCard: TaskCardResource;
}

interface TaskCardsTableProps {
  rows: TaskCardRow[];
  onRemoveControl: (controlId: number) => void;
}

const TaskCardsTable = ({ rows, onRemoveControl }: TaskCardsTableProps) => {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-16 text-muted-foreground">
        <ClipboardList className="size-8 opacity-20" />
        <p className="text-sm">No hay task cards seleccionadas</p>
        <p className="text-xs">Use &quot;Agregar Controles&quot; para incluir servicios programados</p>
      </div>
    );
  }

  // Group by control for row-spanning display
  const groups: { controlId: number; controlTitle: string; taskCards: TaskCardResource[] }[] = [];
  const seen = new Set<number>();
  rows.forEach((row) => {
    if (!seen.has(row.controlId)) {
      seen.add(row.controlId);
      groups.push({
        controlId: row.controlId,
        controlTitle: row.controlTitle,
        taskCards: rows.filter((r) => r.controlId === row.controlId).map((r) => r.taskCard),
      });
    }
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest w-[180px]">Control</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest w-[140px]">N° Tarjeta</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest">Descripción</TableHead>
            <TableHead className="w-[40px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) =>
            group.taskCards.map((tc, idx) => (
              <TableRow key={tc.id} className={cn(idx === 0 && group.taskCards.length > 1 && 'border-t-2 border-t-border/60')}>
                {idx === 0 ? (
                  <TableCell rowSpan={group.taskCards.length} className="align-top border-r">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold leading-tight">{group.controlTitle}</p>
                      <Badge variant="outline" className="text-[10px] tabular-nums">
                        {group.taskCards.length} card{group.taskCards.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </TableCell>
                ) : null}

                <TableCell className="font-mono text-xs">{tc.manual_reference ?? '—'}</TableCell>

                <TableCell className="text-xs text-foreground/80 max-w-[300px]">
                  <p className="line-clamp-2">{tc.description ?? '—'}</p>
                </TableCell>

                {idx === 0 ? (
                  <TableCell rowSpan={group.taskCards.length} className="align-top">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-red-500"
                      onClick={() => onRemoveControl(group.controlId)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            )),
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskCardsTable;
