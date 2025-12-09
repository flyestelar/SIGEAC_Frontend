'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Boxes, Hash, Layers, Package } from 'lucide-react';

interface Props {
  created_by?: string;
  requested_by?: string;
  triggerLabel?: string;
}

/**
 * Minimal dialog to display key article info from a dispatch record.
 * Removes work_order and any imagery.
 */
export default function DispatchArticlesDialog({ requested_by, created_by, triggerLabel = 'Ver Información' }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="px-3">
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Información de Despacho</DialogTitle>
          <DialogDescription>Resumen compacto.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
          {requested_by && (
            <div className="flex flex-col gap-1">
              <Inline icon={<Hash className="size-5" />}>Solicitado por</Inline>
              <Chip icon={<Layers className="size-4" />}>{requested_by}</Chip>
            </div>
          )}
          {created_by && (
            <div className="flex flex-col gap-1">
              <Inline icon={<Hash className="size-5" />}>Creado por</Inline>
              <Chip icon={<Layers className="size-4" />}>{created_by}</Chip>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function qtyLabel(q: string | number) {
  const n = typeof q === 'string' ? Number(q) : q;
  return Number.isFinite(n) ? `Cant. ${n}` : `Cant. ${q}`;
}

function Inline({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5">
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border p-8 text-center">
      <p className="text-sm text-muted-foreground">Sin artículos para mostrar.</p>
    </div>
  );
}
