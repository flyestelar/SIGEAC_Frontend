'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Wrench } from 'lucide-react';
import { WarehouseResponse } from '@/hooks/mantenimiento/almacen/renglones/useGetArticlesByCategory';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import ArticleDropdownActions from '@/components/dropdowns/mantenimiento/almacen/ArticleDropdownActions';

export interface IArticleSimple {
  id: number;
  part_number: string;
  alternative_part_number?: string[];
  description: string;
  quantity: number;
  zone: string;
  article_type: string;
  serial: string | null;
  lot_number: string | null;
  status: string;
  condition: string;
  is_hazardous?: boolean;
  batch_name: string;
  batch_id: number;
  tool?: {
    status?: string | null;
    calibration_date?: string | null; // ISO string o "dd/MM/yyyy"
    next_calibration_date?: string | null; // si guardas fecha
    next_calibration?: number | string | null; // o días
  };
}

export const getStatusBadge = (status: string | null | undefined) => {
  if (!status) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        <XCircle className="h-3 w-3" />
        Sin estado
      </Badge>
    );
  }

  const statusConfig: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning'; icon: any }
  > = {
    stored: { label: 'En Stock', variant: 'default', icon: CheckCircle2 },
    dispatched: { label: 'Despachado', variant: 'secondary', icon: Clock },
    inuse: { label: 'En uso', variant: 'warning', icon: Clock },
    transit: { label: 'En Tránsito', variant: 'outline', icon: Clock },
    maintenance: { label: 'Mantenimiento', variant: 'outline', icon: Clock },
  };

  const config = statusConfig[status.toLowerCase()] || { label: status, variant: 'outline' as const, icon: XCircle };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export const flattenArticles = (data: WarehouseResponse | undefined): IArticleSimple[] => {
  if (!data?.batches) return [];
  console.log(data.batches);
  return data.batches.flatMap((batch) =>
    batch.articles.map((article) => ({
      id: article.id,
      part_number: article.part_number,
      alternative_part_number: article.alternative_part_number,
      serial: article.serial,
      lot_number: article.lot_number,
      description: article.description,
      zone: article.zone,
      // Normalizar cantidad: 0, null o undefined -> 1
      quantity:
        article.quantity === 0 || article.quantity === null || article.quantity === undefined ? 1 : article.quantity,
      status: article.status,
      condition: article.condition ? article.condition.name : 'N/A',
      article_type: article.article_type,
      batch_name: batch.name,
      is_hazardous: batch.is_hazardous ?? undefined,
      batch_id: batch.batch_id,
      tool: article.tool
        ? {
            status: article.tool.status,
            calibration_date: article.tool.calibration_date,
            next_calibration_date: article.tool.next_calibration_date,
            next_calibration: article.tool.next_calibration,
          }
        : undefined,
    })),
  );
};

const baseCols: ColumnDef<IArticleSimple>[] = [
  {
    accessorKey: 'part_number',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Part Number" />,
    cell: ({ row }) => <div className="font-bold text-center text-base">{row.original.part_number}</div>,
  },
  {
    accessorKey: 'alternative_part_number',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Alt. Part Number" />,
    cell: ({ row }) => (
      <div className="font-bold text-center text-base">
        {row.original.alternative_part_number ? row.original.alternative_part_number.join('/ ') : 'N/A'}
      </div>
    ),
  },
  {
    accessorKey: 'serial',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Serial / Lote" />,
    cell: ({ row }) => (
      <div className="text-center text-sm font-medium">
        {row.original.serial ?? row.original.lot_number ?? <span className="text-muted-foreground italic">N/A</span>}
      </div>
    ),
  },
  {
    accessorKey: 'batch_name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
    cell: ({ row }) => (
      <div className="text-muted-foreground font-bold text-center max-w-xs line-clamp-2">
        {row.original.batch_name || 'Sin descripción'}
      </div>
    ),
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cantidad" />,
    cell: ({ row }) => {
      const q = row.original.quantity ?? 0;
      return (
        <div className="flex justify-center">
          <Badge
            variant={q > 5 ? 'default' : q > 0 ? 'secondary' : 'destructive'}
            className="text-base font-bold px-3 py-1"
          >
            {q}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const calibrated = row.original.tool?.status === 'CALIBRADO';
      const calibrating = row.original.tool?.status === 'EN CALIBRACION';
      const descalibrated = row.original.tool?.status === 'VENCIDO';
      return (
        <div className="flex flex-col justify-center items-center space-y-2">
          {getStatusBadge(row.original.status?.toUpperCase())}{' '}
          {row.original.tool && (
            <Badge
              className={cn(
                'text-xs text-center',
                calibrated ? 'bg-green-500' : calibrating ? 'bg-yellow-500' : descalibrated ? 'bg-red-500' : '',
              )}
            >
              {row.original.tool.status ? row.original.tool.status : 'Sin estado'}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'zone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ubicación" />,
    cell: ({ row }) => (
      <div className="text-center font-medium text-sm">
        {row.original.zone || <span className="text-muted-foreground">Sin asignar</span>}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const item = row.original;
      return <ArticleDropdownActions id={item.id} />;
    },
  },
];

// Columnas extra para HERRAMIENTA
export const herramientaCols: ColumnDef<IArticleSimple>[] = [
  ...baseCols,
  {
    accessorKey: 'calibration_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fech. Calibración" />,
    cell: ({ row }) => (
      <div className="text-center text-sm font-bold text-muted-foreground">
        {row.original.tool?.calibration_date ? format(row.original.tool.calibration_date, 'dd/MM/yyyy') : 'N/A'}
      </div>
    ),
  },
  {
    id: 'next_calibration',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Prox. Cal." />,
    cell: ({ row }) => {
      return (
        <div className="text-center text-sm font-bold text-muted-foreground">
          {row.original.tool?.next_calibration && row.original.tool.calibration_date
            ? format(
                addDays(row.original.tool.calibration_date, Number(row.original.tool.next_calibration)),
                'dd/MM/yyyy',
              )
            : 'N/A'}
        </div>
      );
    },
  },
];

// Columnas por categoría
export const getColumnsByCategory = (cat: 'COMPONENTE' | 'CONSUMIBLE' | 'HERRAMIENTA'): ColumnDef<IArticleSimple>[] => {
  if (cat === 'HERRAMIENTA') return herramientaCols;
  return baseCols; // puedes crear sets separados para componente/consumible si lo necesitas
};
