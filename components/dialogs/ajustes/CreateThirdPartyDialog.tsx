'use client';

import CreateThirdPartyForm from '@/components/forms/ajustes/CreateThirdPartyForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

export function CreateThirdPartyDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant={'outline'}
          className="flex items-center justify-center gap-2 h-8 border-dashed"
        >
          Agregar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Creación de Tercero</DialogTitle>
          <DialogDescription>Cree un tercero rellenando la información necesaria.</DialogDescription>
        </DialogHeader>
        <CreateThirdPartyForm roles={[]} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
