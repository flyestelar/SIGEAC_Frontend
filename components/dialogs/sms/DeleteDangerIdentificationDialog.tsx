"use client";

import { useDeleteDangerIdentification } from "@/actions/sms/peligros_identificados/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteProps {
  id: number | string;
  company: string | null;
  onSuccess?: () => void;
}

export default function DeleteDangerIdentificationDialog({
  company,
  id,
}: DeleteProps) {
  const [open, setOpen] = useState(false);
  const { deleteDangerIdentification } = useDeleteDangerIdentification();
  const router = useRouter();
  const handleDelete = async () => {
    const value = {
      company: company,
      id: id.toString(),
    };
    try {
      await deleteDangerIdentification.mutateAsync(value);
      router.push(`/${company}/sms/gestion_reportes/peligros_identificados`);
    } catch (error) {
      console.error("No se pudo eliminar la identificación de peligro", error);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size="sm"
          className="h-8"
        >
          Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-md rounded-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-center">
            ¿Seguro que desea eliminar el reporte?
          </DialogTitle>
          <DialogDescription className="text-center pt-1">
            Esta acción es irreversible y estaría eliminando por completo el
            reporte seleccionado.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 mt-2 sm:flex-row-reverse">
          <Button
            disabled={deleteDangerIdentification.isPending}
            className="rounded-xl hover:bg-white hover:text-black hover:border hover:border-black transition-all"
            onClick={() => handleDelete()}
          >
            {deleteDangerIdentification.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Confirmar"
            )}
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
