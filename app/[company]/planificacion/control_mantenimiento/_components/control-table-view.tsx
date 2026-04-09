'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertBadge, ComputedControl, EnCursoBadge } from './control-grid-shared';

interface ControlTableViewProps {
  controls: ComputedControl[];
  onSelectControl: (id: number) => void;
}

export function ControlTableView({ controls, onSelectControl }: ControlTableViewProps) {
  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="px-0 pb-0 pt-0">
        <ScrollArea className="h-[460px]">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-5 text-[11px] font-semibold uppercase tracking-widest">Control</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest">Referencia</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest">Estado</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest">Métricas</TableHead>
                <TableHead className="pr-5 text-right text-[11px] font-semibold uppercase tracking-widest">Tasks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controls.map((computed) => {
                const { control, status, metrics, isActive } = computed;

                return (
                  <TableRow
                    key={control.id}
                    className="cursor-pointer border-border/50"
                    onClick={() => onSelectControl(control.id)}
                  >
                    <TableCell className="pl-5">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-none text-foreground">{control.title}</p>
                        {isActive && <EnCursoBadge />}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{control.manual_reference || '-'}</TableCell>
                    <TableCell>
                      <AlertBadge status={status} size="small" />
                    </TableCell>
                    <TableCell>
                      {metrics.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {metrics.map((metric) => (
                            <Badge key={metric.type} variant="outline" className="h-5 border-border/60 px-1.5 font-mono text-[10px]">
                              {metric.type}: {metric.consumed.toFixed(1)}/{metric.interval}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin métricas</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-right font-mono text-xs">{control.task_cards?.length ?? 0}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}