'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { Badge } from '@/components/ui/badge';
import { TaskMaster } from '@/types';

export const columns: ColumnDef<TaskMaster>[] = [
  {
    accessorKey: 'source_ref',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Ref." />,
    meta: { title: 'Ref.' },
    cell: ({ row }) => <p className="text-center font-mono">{row.original.source_ref}</p>,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
    meta: { title: 'Título' },
    cell: ({ row }) => <p className="text-center">{row.original.title}</p>,
  },
  {
    accessorKey: 'source_type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fuente" />,
    meta: { title: 'Fuente' },
    cell: ({ row }) => <p className="text-center">{row.original.source_type}</p>,
  },
  {
    accessorKey: 'criticality',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Criticidad" />,
    meta: { title: 'Criticidad' },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Badge variant={row.original.criticality === 'MANDATORY' ? 'destructive' : 'default'}>
          {row.original.criticality}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: 'drivers',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Drivers" />,
    meta: { title: 'Drivers' },
    cell: ({ row }) => {
      const t = row.original;
      return (
        <div className="flex gap-2 flex-wrap justify-center">
          {t.repeat_value_hrs && <Badge>HRS:{t.repeat_value_hrs}</Badge>}
          {t.repeat_value_cyc && <Badge>CYC:{t.repeat_value_cyc}</Badge>}
          {t.repeat_value_days && <Badge>DAYS:{t.repeat_value_days}</Badge>}
          {!t.repeat_value_hrs && !t.repeat_value_cyc && !t.repeat_value_days && (
            <>
              {t.thresh_value_hrs && <Badge>TH-H:{t.thresh_value_hrs}</Badge>}
              {t.thresh_value_cyc && <Badge>TH-C:{t.thresh_value_cyc}</Badge>}
              {t.thresh_value_days && <Badge>TH-D:{t.thresh_value_days}</Badge>}
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Acciones" />,
    meta: { title: 'Acciones' },
    cell: ({ row }) => (
      <div className="flex justify-center">
        {/* Aquí irán tus acciones, por ahora puedes dejar un botón simple */}
        <Badge variant="outline">Ver</Badge>
      </div>
    ),
  },
];
