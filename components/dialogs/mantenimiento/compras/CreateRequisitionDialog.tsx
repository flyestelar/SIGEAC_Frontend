'use client';

import { CreateGeneralRequisitionForm } from '@/components/forms/mantenimiento/compras/CreateGeneralRequisitionForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export function CreateRequisitionDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const userRoles = user?.roles?.map((role) => role.name) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant={'outline'}
          className="flex items-center justify-center gap-2 h-8 border-dashed"
        >
          Nueva Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Solicitud de Material Faltante</DialogTitle>
          <DialogDescription>
            Genere una solicitud de material faltante mediante el siguiente formulario.
          </DialogDescription>
        </DialogHeader>

        <CreateGeneralRequisitionForm isEditing={false} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
