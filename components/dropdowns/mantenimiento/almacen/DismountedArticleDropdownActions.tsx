'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, MoreHorizontal, Pencil, ShieldAlert, Warehouse } from 'lucide-react';

import { useUpdateArticleStatus } from '@/actions/mantenimiento/almacen/inventario/articulos/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';

type Target = 'STORED' | 'QUARENTINE';

const TARGETS: Record<
  Target,
  {
    label: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  }
> = {
  STORED: {
    label: 'Enviar a almacén',
    title: '¿Enviar componente a almacén?',
    description: 'El componente pasará al inventario como STORED y volverá a estar disponible en stock.',
    icon: Warehouse,
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  QUARENTINE: {
    label: 'Enviar a cuarentena',
    title: '¿Enviar componente a cuarentena?',
    description: 'El componente quedará en cuarentena a la espera de inspección o documentación.',
    icon: ShieldAlert,
    accent: 'text-amber-600 dark:text-amber-400',
  },
};

interface Props {
  id: number;
}

const DismountedArticleDropdownActions = ({ id }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedCompany } = useCompanyStore();
  const { updateArticleStatus } = useUpdateArticleStatus();

  const [target, setTarget] = useState<Target | null>(null);

  const handleEdit = () => {
    router.push(`/${selectedCompany?.slug}/almacen/inventario/editar/${id}`);
  };

  const handleConfirm = async () => {
    if (!target) return;
    await updateArticleStatus.mutateAsync({ id, status: target });
    queryClient.invalidateQueries({
      predicate: (q) => (q.queryKey[0] as { _id?: string } | undefined)?._id === 'articleList',
    });
    setTarget(null);
  };

  const active = target ? TARGETS[target] : null;
  const ActiveIcon = active?.icon;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleEdit} className="cursor-pointer gap-2">
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Editar artículo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Cambiar estado
          </DropdownMenuLabel>
          {(Object.keys(TARGETS) as Target[]).map((t) => {
            const cfg = TARGETS[t];
            const Icon = cfg.icon;
            return (
              <DropdownMenuItem key={t} onClick={() => setTarget(t)} className="cursor-pointer gap-2">
                <Icon className={cn('h-4 w-4', cfg.accent)} />
                {cfg.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start gap-3">
              {ActiveIcon && (
                <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/30">
                  <ActiveIcon className={cn('h-4 w-4', active?.accent)} />
                </div>
              )}
              <div className="space-y-1">
                <DialogTitle>{active?.title}</DialogTitle>
                <DialogDescription>{active?.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTarget(null)} disabled={updateArticleStatus.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={updateArticleStatus.isPending}>
              {updateArticleStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DismountedArticleDropdownActions;
