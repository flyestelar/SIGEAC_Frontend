'use client';

import CreateFlightControlForm from "@/components/forms/mantenimiento/ordenes_trabajo/CreateFlightControlForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";

export function CreateFlightControlDialog({ defaultAircraftId }: { defaultAircraftId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Registrar Vuelo
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[750px]">
        <DialogHeader className="border-b bg-muted/20 p-6 pb-4">
          <DialogTitle>Registro de Control de Vuelo</DialogTitle>
          <DialogDescription>
            Documente los datos operacionales, ruta y métricas de consumo de la aeronave.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto p-6">
          <CreateFlightControlForm defaultAircraftId={defaultAircraftId} onClose={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
