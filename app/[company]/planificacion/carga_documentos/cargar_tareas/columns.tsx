'use client';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExtractionRow } from '@/hooks/planificacion/directivas/useGetExtractions';
import { useCompanyStore } from '@/stores/CompanyStore';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Info } from 'lucide-react';
import Link from 'next/link';


function StatusBadge({ s }: { s: ExtractionRow['status'] }) {
  switch (s) {
    case 'APPROVED':
      return <Badge className="bg-green-600 hover:bg-green-700">Aprobado</Badge>;
    case 'REVIEW':
      return <Badge variant="secondary">En revisión</Badge>;
    case 'PENDING':
      return <Badge>Pendiente</Badge>;
    case 'REJECTED':
      return <Badge variant="destructive">Rechazado</Badge>;
    default:
      return <Badge>—</Badge>;
  }
}

function ConfidenceBadge({ v }: { v?: number }) {
  const pct = Math.round((v ?? 0) * 100);
  const label = Number.isFinite(pct) ? `${pct}%` : '—';
  const variant = pct >= 80 ? 'default' : pct >= 60 ? 'secondary' : 'destructive';
  return <Badge variant={variant}>{label}</Badge>;
}



const ViewCell = ({ id }: { id: string }) => {
  const { selectedCompany } = useCompanyStore()
  return (
    <div className="flex justify-center">
      <Button asChild size="sm" variant="outline" className="gap-1">
        <Link href={`/${selectedCompany?.slug}/planificacion/carga_documentos/cargar_directivas/${id}`}>
          <Eye className="h-4 w-4" />
          Revisar
        </Link>
      </Button>
    </div>
  )

}


// Extrae y resume la aplicabilidad desde el payload sin romper tipos
function ApplicabilityCell({ row }: { row: ExtractionRow }) {
  const { selectedCompany } = useCompanyStore()
  // Intentamos leer desde row.payload (fallbacks defensivos)
  const payload: any = (row as any).payload ?? {};
  const app = payload.applicability?.aircraft;
  const manufacturer: string | undefined = app?.manufacturer;
  const rawSeries: string[] = Array.isArray(app?.series) ? app.series : [];

  // “Válidas”: patrón -### o -#### (e.g., -100 … -500). Atípicas: resto.
  const valid = rawSeries.filter((s) => /^-\d{3,4}$/.test(s));
  const anomalous = rawSeries.filter((s) => !/^-\d{3,4}$/.test(s));

  // Preview corto de series válidas (primeras 3)
  const preview = valid.length
    ? `${valid.slice(0, 3).join(', ')}${valid.length > 3 ? ` +${valid.length - 3}` : ''}`
    : '—';

  const anomalousCount = anomalous.length;

  if (!manufacturer && !rawSeries.length) return <p className="text-center">—</p>;

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="text-center">{manufacturer ?? '—'} {preview !== '—' ? `: ${preview}` : ''}</span>
        {(anomalousCount > 0) && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="cursor-pointer gap-1">
                <Info className="h-3 w-3" />
                {`+${anomalousCount} atípicos`}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-[320px]">
              <p className="text-xs">
                Series no estándar detectadas:
                <br />
                {anomalous.slice(0, 10).join(', ')}
                {anomalous.length > 10 ? `, +${anomalous.length - 10} más` : ''}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

export const columns: ColumnDef<ExtractionRow>[] = [
  {
    accessorKey: 'source_ref',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="AD Ref" />,
    meta: { title: 'AD Ref' },
    cell: ({ row }) => <p className="text-center">{row.original.payload.source_ref ?? '—'}</p>,
  },
  {
    accessorKey: 'effective_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha efectiva" />,
    meta: { title: 'Fecha efectiva' },
    cell: ({ row }) => (
      <p className="text-center">{format(row.original.payload.effective_date, 'PPP', { locale: es })}</p>
    ),
    sortingFn: (a, b) =>
      new Date(a.original.effective_date ?? 0).getTime() -
      new Date(b.original.effective_date ?? 0).getTime(),
  },
  {
    accessorKey: 'parser',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Parser" />,
    meta: { title: 'Parser' },
    cell: ({ row }) => <p className="text-center">{row.original.parser ?? '—'}</p>,
  },
  {
    id: 'applicability',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Aplicabilidad" />,
    meta: { title: 'Aplicabilidad' },
    cell: ({ row }) => <ApplicabilityCell row={row.original} />,
    enableSorting: false,
  },
  {
    accessorKey: 'groups',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Grupos" />,
    meta: { title: 'Grupos' },
    cell: ({ row }) => <p className="text-center">{row.original.payload.groups.length}</p>,
  },
  {
    id: 'confidence',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Confianza" />,
    meta: { title: 'Confianza' },
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <ConfidenceBadge v={row.original.confidence?.global} />
      </div>
    ),
    sortingFn: (a, b) => (a.original.confidence?.global ?? 0) - (b.original.confidence?.global ?? 0),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Estado" />,
    meta: { title: 'Estado' },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <StatusBadge s={row.original.status} />
      </div>
    ),
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha de Carga" />,
    meta: { title: 'Cargado' },
    cell: ({ row }) => <p className="text-center">{format(row.original.created_at, 'PPP', { locale: es })}</p>,
    sortingFn: (a, b) =>
      new Date(a.original.created_at ?? 0).getTime() -
      new Date(b.original.created_at ?? 0).getTime(),
  },
  {
    id: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Acciones" />,
    meta: { title: 'Acciones' },
    cell: ({ row }) => (
      <ViewCell id={row.original.id.toString()} />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
