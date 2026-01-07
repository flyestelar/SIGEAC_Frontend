'use client';

import ClientDropdownActions from '@/components/dropdowns/general/ClientDropdownActions';
import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';
import { Badge } from '@/components/ui/badge';
import { ThirdParty } from '@/types';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<ThirdParty>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Nombre" />,
    meta: { title: 'Nombre' },
    cell: ({ row }) => <div className="flex justify-center font-bold">{row.original.name}</div>,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="RIF / C.I" />,
    meta: { title: 'RIF / C.I' },
    cell: ({ row }) => <div className="flex justify-center font-bold">{row.original.email ?? 'N/A'}</div>,
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Nro. TLF" />,
    meta: { title: 'Nro. TLF' },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="text-muted-foreground italic">{row.original.phone ?? 'N/A'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'third_party_role',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Rol" />,
    meta: { title: 'Rol' },
    cell: ({ row }) => <p className="font-bold text-center">{row.original.third_party_role.label}</p>,
  },
  ,
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Estado" />,
    meta: { title: 'Estado' },
    cell: ({ row }) => <Badge>{row.original.status}</Badge>,
  },
  // {
  //   id: 'actions',
  //   cell: ({ row }) => {
  //     const client = row.original;
  //     return <ClientDropdownActions client={client} />;
  //   },
  // },
];
