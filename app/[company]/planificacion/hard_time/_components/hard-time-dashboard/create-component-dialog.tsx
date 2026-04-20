import { useCreateHardTimeComponent } from '@/actions/planificacion/hard_time/actions';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGetBatchesByCategory } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesByCategory';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardTimeCategoryResource } from '@api/types';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ComponentFormState } from './types';

type CreateComponentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraftId: number | null;
  categories: HardTimeCategoryResource[];
  defaultCategoryCode?: string | null;
};

export function CreateComponentDialog({
  open,
  onOpenChange,
  aircraftId,
  categories,
  defaultCategoryCode,
}: CreateComponentDialogProps) {
  const createComponent = useCreateHardTimeComponent(aircraftId);
  const { data: componentBatches, isFetching: isLoadingBatches } = useGetBatchesByCategory('COMPONENTE');
  const [form, setForm] = useState<ComponentFormState>({
    category_code: defaultCategoryCode ?? '',
    batch_id: '',
    part_number: '',
    description: '',
    position: '',
  });
  const [isBatchPopoverOpen, setIsBatchPopoverOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        category_code: defaultCategoryCode ?? '',
        batch_id: '',
        part_number: '',
        description: '',
        position: '',
      });
      setIsBatchPopoverOpen(false);
    }
  }, [open, defaultCategoryCode]);

  const batchOptions = useMemo(
    () =>
      [...(componentBatches ?? [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [componentBatches],
  );

  const selectedBatch = useMemo(
    () => batchOptions.find((batch) => `${batch.id}` === form.batch_id) ?? null,
    [batchOptions, form.batch_id],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!aircraftId) return;

    await createComponent.mutateAsync({
      body: {
        aircraft_id: aircraftId,
        category_code: form.category_code,
        batch_id: Number(form.batch_id),
        part_number: form.part_number.trim(),
        description: form.description.trim(),
        position: form.position.trim(),
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo componente ATA</DialogTitle>
          <DialogDescription>Registra un componente controlado dentro del capítulo ATA seleccionado.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Capítulo ATA</label>
            <Select
              value={form.category_code}
              onValueChange={(value) => setForm((current) => ({ ...current, category_code: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona capítulo ATA" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.code} value={category.code}>
                    {category.name} ({category.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Part Number</label>
              <Input
                value={form.part_number}
                onChange={(event) => setForm((current) => ({ ...current, part_number: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ubicación</label>
              <Input
                value={form.position}
                onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
                placeholder="ENG-1-FP"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Batch</label>
            <Popover open={isBatchPopoverOpen} onOpenChange={setIsBatchPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={isBatchPopoverOpen}
                  className={cn('w-full justify-between font-normal', !form.batch_id && 'text-muted-foreground')}
                >
                  <span className="truncate">{selectedBatch?.name || 'Selecciona un batch de componente'}</span>
                  {isLoadingBatches ? (
                    <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60" />
                  ) : (
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar batch..." />
                  <CommandList>
                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                      {isLoadingBatches ? 'Cargando...' : 'No se encontraron componentes.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {batchOptions.map((batch) => (
                        <CommandItem
                          key={batch.id}
                          value={`${batch.name} ${batch.description ?? ''} ${batch.ata_code ?? ''}`}
                          onSelect={() => {
                            setForm((current) => ({ ...current, batch_id: `${batch.id}` }));
                            setIsBatchPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              form.batch_id === `${batch.id}` ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{batch.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {batch.description || batch.ata_code || 'Sin descripción adicional'}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones</label>
            <Input
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Observaciones del componente"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!aircraftId || !form.category_code || !form.batch_id || createComponent.isPending}
            >
              {createComponent.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Crear componente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
