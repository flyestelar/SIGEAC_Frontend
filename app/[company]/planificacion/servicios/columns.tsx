'use client';

import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';

import MaintenanceServiceDropdownActions from '@/components/dropdowns/mantenimiento/ordenes_trabajo/MaintenanceServiceDropdownActionts';
import { Checkbox } from '@/components/ui/checkbox';
import { MaintenanceProgramService } from '@/types/services';

export const columns: ColumnDef<MaintenanceProgramService>[] = [
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
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Nombre del Servicio" />,
    cell: ({ row }) => <p className="flex justify-center font-bold">{row.original.title}</p>,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
    cell: ({ row }) => <p className="flex justify-center font-bold italic">{row.original.description}</p>,
  },
  {
    accessorKey: 'nro_ata',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ATA" />,
    cell: ({ row }) => <p className="flex justify-center font-medium">{row.original.nro_ata ?? '-'}</p>,
  },
  {
    accessorKey: 'threshold_fh',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Threshold FH" />,
    cell: ({ row }) => <p className="flex justify-center">{row.original.threshold_fh ?? '-'}</p>,
  },
  {
    accessorKey: 'threshold_fc',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Threshold FC" />,
    cell: ({ row }) => <p className="flex justify-center">{row.original.threshold_fc ?? '-'}</p>,
  },
  {
    accessorKey: 'threshold_days',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Threshold (días)" />,
    cell: ({ row }) => <p className="flex justify-center">{row.original.threshold_days ?? '-'}</p>,
  },
  {
    accessorKey: 'repeat_fh',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Repeat FH" />,
    cell: ({ row }) => <p className="flex justify-center">{row.original.repeat_fh ?? '-'}</p>,
  },
  {
    accessorKey: 'repeat_fc',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Repeat FC" />,
    cell: ({ row }) => <p className="flex justify-center">{row.original.repeat_fc ?? '-'}</p>,
  },
  {
    accessorKey: 'repeat_days',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Repeat (días)" />,
    cell: ({ row }) => <p className="flex justify-center">{row.original.repeat_days ?? '-'}</p>,
  },
  {
    accessorKey: 'task_cards_count',
    header: ({ column }) => <DataTableColumnHeader column={column} title="# Task Cards" />,
    cell: ({ row }) => <p className="flex justify-center">{row.original.task_cards_count ?? 0}</p>,
  },
  {
    accessorKey: 'applicable_aircraft_types_count',
    header: ({ column }) => <DataTableColumnHeader column={column} title="# Aircraft Types" />,
    cell: ({ row }) => <p className="flex justify-center">{row.original.applicable_aircraft_types_count ?? 0}</p>,
  },
  {
    accessorKey: 'part_numbers_count',
    header: ({ column }) => <DataTableColumnHeader column={column} title="# Part Numbers" />,
    cell: ({ row }) => <p className="flex justify-center">{row.original.part_numbers_count ?? 0}</p>,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const item = row.original;
      return <MaintenanceServiceDropdownActions service={row.original} />;
    },
  },
];
