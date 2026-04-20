import { useCreateHardTimeComponent } from '@/actions/planificacion/hard_time/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardTimeCategoryResource } from '@api/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ComponentFormState } from './types';

type CreateComponentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraftId: number | null;
  categories: HardTimeCategoryResource[];
};

export function CreateComponentDialog({ open, onOpenChange, aircraftId, categories }: CreateComponentDialogProps) {
  const createComponent = useCreateHardTimeComponent(aircraftId);
  const [form, setForm] = useState<ComponentFormState>({
    category_code: '',
    part_number: '',
    description: '',
    position: '',
  });

  useEffect(() => {
    if (!open) {
      setForm({
        category_code: '',
        part_number: '',
        description: '',
        position: '',
      });
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!aircraftId) return;

    await createComponent.mutateAsync({
      body: {
        aircraft_id: aircraftId,
        category_code: form.category_code,
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
            <label className="text-sm font-medium">Descripción</label>
            <Input
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!aircraftId || !form.category_code || !form.description.trim() || createComponent.isPending}
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
