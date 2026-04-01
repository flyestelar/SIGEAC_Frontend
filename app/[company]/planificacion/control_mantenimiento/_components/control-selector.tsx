'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCompanyStore } from '@/stores/CompanyStore';
import { MaintenanceControlResource } from '@api/types';
import { BookOpen, ClipboardList, Edit, FileText, Plane } from 'lucide-react';
import Link from 'next/link';

interface ControlSelectorProps {
  controls: MaintenanceControlResource[];
  selectedControlId: number | null;
  onSelectControl: (id: number) => void;
}

export function ControlSelector({ controls, selectedControlId, onSelectControl }: ControlSelectorProps) {
  const { selectedCompany } = useCompanyStore();
  if (controls.length === 0) {
    return (
      <Card className="border-border/60 bg-card">
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Selecciona una aeronave para ver sus controles
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Los controles de mantenimiento se filtran por aeronave seleccionada
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          Controles de Mantenimiento
          <Badge variant="secondary" className="ml-auto font-mono text-xs">
            {controls.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {controls.map((control) => {
              const isSelected = selectedControlId === control.id;

              return (
                <button
                  key={control.id}
                  onClick={() => onSelectControl(control.id)}
                  className={`group relative shrink-0 rounded-lg border p-3 text-left transition-all w-[220px] ${
                    isSelected
                      ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border'
                  }`}
                >
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento/${control.id}/editar`}>
                        <Edit className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                        isSelected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`text-sm font-medium leading-tight truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}
                      >
                        {control.title}
                      </h3>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground truncate">
                        {control.manual_reference}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <Badge variant="outline" className="h-5 border-border/60 px-1.5 text-[10px] font-normal">
                      <ClipboardList className="mr-0.5 h-2.5 w-2.5" />
                      {control.task_cards?.length}
                    </Badge>
                    <Badge variant="outline" className="h-5 border-border/60 px-1.5 text-[10px] font-normal">
                      <Plane className="mr-0.5 h-2.5 w-2.5" />
                      {control.aircrafts?.length}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
