'use client';

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Hash, Layers, Boxes } from 'lucide-react';
import { Fragment, useMemo } from 'react';

// Types that match your endpoint payload
export interface DispatchArticle {
  id: number;
  part_number: string;
  serial: string | null;
  description: string | null;
  category?: string | null;
  batch: string;
  dispatch_quantity: string | number;
}

interface Props {
  articles?: DispatchArticle[];
  triggerLabel?: string;
}

/**
 * Minimal dialog to display key article info from a dispatch record.
 * Removes work_order and any imagery.
 */
export default function DispatchArticlesDialogMinimal({ articles, triggerLabel = 'Ver artículos' }: Props) {
  const items = useMemo(() => articles ?? [], [articles]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="px-3">
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Artículos despachados</DialogTitle>
          <DialogDescription>Resumen compacto por ítem.</DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y rounded-xl border">
              {items.map((a) => (
                <li key={a.id} className="p-3 sm:p-4 grid gap-2">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.batch}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        <Inline icon={<Hash className="h-3.5 w-3.5" />}>{a.part_number}</Inline>
                      </p>
                    </div>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {qtyLabel(a.dispatch_quantity)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {a.serial ? (
                      <Chip icon={<Package className="h-3.5 w-3.5" />}>SN {a.serial}</Chip>
                    ) : (
                      <span>SIN SERIAL</span>
                    )}
                    <Chip icon={<Layers className="h-3.5 w-3.5" />}>{a.category || 'SIN CATEGORÍA'}</Chip>
                    <Chip icon={<Boxes className="h-3.5 w-3.5" />}>{a.description || 'SIN DESCRIPCIÓN'}</Chip>
                  </div>
                </li>
              ))}
            </ul>
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
