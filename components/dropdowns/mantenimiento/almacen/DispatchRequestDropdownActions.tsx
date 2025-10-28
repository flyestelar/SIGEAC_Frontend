import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useUpdateArticleStatus } from '@/actions/mantenimiento/almacen/inventario/articulos/actions';
import { useCompanyStore } from '@/stores/CompanyStore';
import { IterationCw, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../ui/dialog';
import { useCancelDispatchRequest } from '@/actions/mantenimiento/almacen/solicitudes/salida/action';

const DispatchRequestDropdownActions = ({ id }: { id: string | number }) => {
  const [open, setOpen] = useState<boolean>(false);
  const { cancelDispatchRequest } = useCancelDispatchRequest();

  const handleCancel = async (id: number) => {
    await cancelDispatchRequest.mutateAsync({ id });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="flex gap-2 justify-center">
          <DialogTrigger asChild>
            <DropdownMenuItem className="cursor-pointer">
              <IterationCw className="size-5" />
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">¿Desea cancelar el despacho?</DialogTitle>
          <DialogDescription className="text-center p-2 mb-0 pb-0">
            Los articulos volverán a estar disponibles en su almacén.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 md:gap-0">
          <Button
            className="bg-rose-400 hover:bg-white hover:text-black hover:border hover:border-black"
            onClick={() => setOpen(false)}
            type="submit"
          >
            Cancelar
          </Button>
          <Button
            disabled={cancelDispatchRequest.isPending}
            className="hover:bg-white hover:text-black hover:border hover:border-black transition-all"
            onClick={() => handleCancel(Number(id))}
          >
            {cancelDispatchRequest.isPending ? <Loader2 className="size-4 animate-spin" /> : <p>Confirmar</p>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DispatchRequestDropdownActions;
