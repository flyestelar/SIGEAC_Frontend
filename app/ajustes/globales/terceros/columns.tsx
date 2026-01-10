'use client';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { Badge } from '@/components/ui/badge';
import { ThirdParty } from '@/types';
import { ColumnDef } from '@tanstack/react-table';

function statusVariant(status?: string) {
  const s = (status ?? '').toUpperCase();
  if (s === 'ACTIVO' || s === 'APROBADO') return 'default';
  if (s === 'INACTIVO' || s === 'RECHAZADO') return 'destructive';
  if (s === 'PROCESO' || s === 'PENDIENTE') return 'secondary';
  return 'outline';
}

export const columns: ColumnDef<ThirdParty>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Nombre" />,
    meta: { title: 'Nombre' },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="font-semibold leading-none">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="RIF / C.I" />,
    meta: { title: 'RIF / C.I' },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="font-medium">{row.original.email ?? 'N/A'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Nro. TLF" />,
    meta: { title: 'Nro. TLF' },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="text-muted-foreground">{row.original.phone ?? 'N/A'}</span>
      </div>
    ),
  },
  {
    // IMPORTANTE: si tu data tiene `party_roles`, usa ese accessorKey.
    // Si realmente se llama `third_party_role`, ajústalo abajo.
    accessorKey: 'party_roles',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Roles" />,
    meta: { title: 'Roles' },
    cell: ({ row }) => {
      const raw = (row.original as any).party_roles;

      // Soporta: array, objeto único, null
      const roles = Array.isArray(raw) ? raw : raw ? [raw] : [];

      if (!roles.length) {
        return (
          <div className="flex justify-center">
            <span className="text-muted-foreground">N/A</span>
          </div>
        );
      }

      return (
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-1.5 max-w-[340px]">
            {roles.map((r: any, idx: number) => (
              <Badge key={r?.id ?? `${r?.label ?? 'role'}-${idx}`} variant="secondary" className="rounded-full">
                {r?.label ?? String(r)}
              </Badge>
            ))}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Estado" />,
    meta: { title: 'Estado' },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Badge variant={statusVariant(row.original.status)} className="rounded-full">
          {(row.original.status ?? 'N/A').toString()}
        </Badge>
      </div>
    ),
  },
  // {
  //   id: 'actions',
  //   header: () => <div className="text-right pr-2">Acciones</div>,
  //   cell: ({ row }) => (
  //     <div className="flex justify-end pr-2">
  //       <ClientDropdownActions client={row.original} />
  //     </div>
  //   ),
  // },
];
