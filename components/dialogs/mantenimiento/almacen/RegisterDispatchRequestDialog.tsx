'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { ConsumableDispatchForm } from '@/components/forms/mantenimiento/almacen/ConsumableDispatchRequestForm';
import { ToolDispatchForm } from '@/components/forms/mantenimiento/almacen/ToolDispatchForm';
import { ComponentDispatchForm } from '@/components/forms/mantenimiento/almacen/ComponentDispatchForm';

export function RegisterDispatchRequestDialog() {
  const [open, setOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant={'outline'}
          className="flex items-center justify-center gap-2 h-8 border-dashed"
        >
          Registrar Salida
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Registro de Salida</DialogTitle>
          <DialogDescription>
            {category ? `Rellene el formulario para ${category}.` : 'Seleccione una categoria...'}
          </DialogDescription>
        </DialogHeader>

        <div className="border-b px-6 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={'sm'} className="w-[160px]">
                {category ? category.toUpperCase() : <span className="text-muted-foreground">Seleccionar tipo...</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setCategory('consumible')}>Consumible</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('componente')}>Componente</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('herramienta')}>Herramienta</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {category === 'consumible' && <ConsumableDispatchForm onClose={() => setOpen(false)} />}
            {category === 'herramienta' && <ToolDispatchForm onClose={() => setOpen(false)} />}
            {category === 'componente' && <ComponentDispatchForm onClose={() => setOpen(false)} />}
            {!category && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Seleccione un tipo de salida para continuar.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
