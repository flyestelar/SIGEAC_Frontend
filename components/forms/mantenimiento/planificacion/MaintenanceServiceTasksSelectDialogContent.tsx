'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetTaskCards } from '@/hooks/planificacion/tareas/useGetTaskCards';
import { useDebouncedInput } from '@/lib/useDebounce';
import { cn } from '@/lib/utils';
import type { TaskCard } from '@/types';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { ServiceFormValues } from './types';

interface MaintenanceServiceTasksSelectDialogContentProps {}

const MaintenanceServiceTasksSelectDialogContent: React.FC<MaintenanceServiceTasksSelectDialogContentProps> = () => {
  const { control } = useFormContext<ServiceFormValues>();

  const [taskQuery, setTaskQuery] = useState('');

  useEffect(() => {
    setTaskPage(1);
  }, [taskQuery]);

  const [taskQueryInput, setTaskQueryInput] = useDebouncedInput(taskQuery, setTaskQuery, 350);
  const [taskPage, setTaskPage] = useState(1);
  const taskItemsPerPage = 10;

  const { data: taskCardsResponse, isLoading: tasksLoading } = useGetTaskCards({
    page: taskPage,
    perPage: taskItemsPerPage,
    search: taskQuery,
  });
  const taskCards = useMemo(() => taskCardsResponse?.data ?? [], [taskCardsResponse?.data]);
  const totalTasks = taskCardsResponse?.meta?.total ?? 0;
  const currentPage = taskCardsResponse?.meta?.current_page ?? taskPage;
  const totalPages = taskCardsResponse?.meta?.last_page ?? 1;
  const paginationFrom = taskCardsResponse?.meta?.from ?? 0;
  const paginationTo = taskCardsResponse?.meta?.to ?? 0;

  const {
    fields: selectedTasks,
    append,
    remove,
    move,
  } = useFieldArray<ServiceFormValues, 'tasks', 'fieldId'>({
    control,
    name: 'tasks',
    keyName: 'fieldId',
  });

  const toggleTask = (task: TaskCard) => {
    const selectedIndex = selectedTasks.findIndex((x) => x.id === task.id);
    if (selectedIndex >= 0) {
      remove(selectedIndex);
      return;
    }

    append(task);
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(80vh-8rem)]">
      <div className="min-h-0 col-span-4 border rounded-lg p-3 flex flex-col">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar tareas..."
            value={taskQueryInput}
            onChange={(e) => setTaskQueryInput(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-sm gap-2">
          <span className="text-muted-foreground">Resultados</span>
          <Badge variant="outline">{totalTasks}</Badge>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <span>{paginationFrom && paginationTo ? `${paginationFrom} - ${paginationTo}` : 'Sin resultados'}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTaskPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1 || tasksLoading}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTaskPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages || tasksLoading || totalTasks === 0}
          >
            Siguiente
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="mt-3 rounded-md border h-full">
          <div className="p-2 space-y-1">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                Cargando tareas...
              </div>
            ) : taskCards.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                No hay resultados para esta búsqueda
              </div>
            ) : (
              taskCards.map((t) => {
                const checked = selectedTasks.some((x) => x.id === t.id);
                return (
                  <div
                    key={t.id}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer',
                      checked && 'bg-muted/50',
                    )}
                    onClick={() => toggleTask(t)}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleTask(t)} />
                    <div className="flex flex-col flex-1 pl-1">
                      <span className="text-sm font-medium leading-none">{t.description}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {t.manual_reference ? `Manual: ${t.manual_reference}` : 'Manual: --'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="col-span-8 border rounded-lg p-3 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Asignadas al servicio</span>
          <Badge variant="secondary">{selectedTasks.length}</Badge>
        </div>
        <ScrollArea className="mt-2 rounded-md border h-full">
          <div className="divide-y pr-4">
            {selectedTasks.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                No hay tareas seleccionadas
              </div>
            ) : (
              selectedTasks.map((sel, index) => {
                return (
                  <div key={sel.fieldId} className="p-3 flex gap-3 items-center hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                        <button
                          type="button"
                          className="inline-flex h-4 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                          onClick={() => move(index, index - 1)}
                          disabled={index === 0}
                          aria-label="Mover tarea arriba"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-4 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                          onClick={() => move(index, index + 1)}
                          disabled={index === selectedTasks.length - 1}
                          aria-label="Mover tarea abajo"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium line-clamp-2">
                        {sel.description || `Tarea ID: ${sel.id}`}
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                        {sel.manual_reference && <span>Manual: {sel.manual_reference}</span>}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default MaintenanceServiceTasksSelectDialogContent;
