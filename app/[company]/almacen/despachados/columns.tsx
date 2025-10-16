'use client';

import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';

import { Checkbox } from '@/components/ui/checkbox';
import { DispachedArticles } from '@/hooks/mantenimiento/almacen/salidas_entradas/useGetDispatchedArticles';
import DispatchedArticlesDropdownActions from '@/components/dropdowns/mantenimiento/almacen/DispatchedArticlesDropdownActions';

export const columns: ColumnDef<DispachedArticles>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'batch',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Descripción" />,
    cell: ({ row }) => {
      return <p className="font-bold text-center">{row.original.batch}</p>;
    },
  },
  {
    accessorKey: 'part_number',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="PN" />,
    cell: ({ row }) => {
      return <p className="font-medium text-center">{row.original.part_number}</p>;
    },
  },
  {
    accessorKey: 'alternative_part_number',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="PN Alternativo" />,
    cell: ({ row }) => {
      return (
        <p className="font-medium text-center">
          {row.original.alternative_part_number ? row.original.alternative_part_number.join(', ') : '-'}
        </p>
      );
    },
  },
  {
    accessorKey: 'serial',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Serial / Lote" />,
    cell: ({ row }) => {
      return (
        <p className="font-medium text-center">
          {row.original.serial ? row.original.serial : row.original.lot_number ? row.original.lot_number : '-'}
        </p>
      );
    },
  },
  {
    accessorKey: 'aircraft',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Aeronave / Taller" />,
    cell: ({ row }) => {
      return (
        <p className="font-medium text-center">
          {row.original.aircraft
            ? row.original.aircraft.acronym
            : row.original.workshop
              ? row.original.workshop.name
              : '-'}
        </p>
      );
    },
  },
  {
    id: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Acciones" />,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <DispatchedArticlesDropdownActions id={row.original.id} />
      </div>
    ),
  },
];
