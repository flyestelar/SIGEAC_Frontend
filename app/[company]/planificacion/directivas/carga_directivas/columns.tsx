'use client';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExtractionRow } from '@/hooks/planificacion/directivas/useGetExtractions';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
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

export const columns: ColumnDef<ExtractionRow>[] = [
  {
    accessorKey: 'source_ref',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="AD Ref" />,
    meta: { title: 'AD Ref' },
    cell: ({ row }) => <p className="text-center">{row.original.source_ref ?? '—'}</p>,
  },
  {
    accessorKey: 'effective_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha efectiva" />,
    meta: { title: 'Fecha efectiva' },
    cell: ({ row }) => <p className="text-center">{format(row.original.effective_date ?? '', 'PPP')}</p>,
  },
  {
    accessorKey: 'parser',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Parser" />,
    meta: { title: 'Parser' },
    cell: ({ row }) => <p className="text-center">{row.original.parser}</p>,
  },
  {
    accessorKey: 'groups_count',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Grupos" />,
    meta: { title: 'Grupos' },
    cell: ({ row }) => <p className="text-center">{row.original.groups_count ?? 0}</p>,
  },
  {
    id: 'confidence',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Confianza" />,
    meta: { title: 'Confianza' },
    cell: ({ row }) => {
      const v = Math.round((row.original.confidence?.global ?? 0) * 100);
      const label = Number.isFinite(v) ? `${v}%` : '—';
      return (
        <div className="flex items-center justify-center">
          <Badge variant={v >= 80 ? 'default' : v >= 60 ? 'secondary' : 'destructive'}>{label}</Badge>
        </div>
      );
    },
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cargado" />,
    meta: { title: 'Cargado' },
    cell: ({ row }) => <p className="text-center">{format(row.original.created_at, 'PPP')}</p>,
  },
  {
    id: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Acciones" />,
    meta: { title: 'Acciones' },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Button asChild size="sm" variant="outline" className="gap-1">
          <Link href={`/extractions/${row.original.id}`}>
            <Eye className="h-4 w-4" />
            Review
          </Link>
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
