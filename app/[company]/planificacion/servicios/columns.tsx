'use client';

import { createColumnHelper } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/tables/DataTableHeader';

import MaintenanceServiceDropdownActions from '@/components/dropdowns/mantenimiento/ordenes_trabajo/MaintenanceServiceDropdownActionts';
import { Checkbox } from '@/components/ui/checkbox';
import { MaintenanceProgramService } from '@/types/planification';

const ch = createColumnHelper<MaintenanceProgramService>();

export const columns = [
  ch.display({
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
  }),
  ch.accessor('title', {
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Nombre del Servicio" />,
    cell: (item) => <p className="flex justify-center font-bold">{item.getValue()}</p>,
  }),
  ch.accessor('description', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
    cell: (item) => <p className="flex justify-center font-bold italic">{item.getValue()}</p>,
  }),
  ch.accessor('nro_ata', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="ATA" />,
    cell: (item) => <p className="flex justify-center font-medium">{item.getValue() ?? '-'}</p>,
  }),
  ch.accessor('threshold_fh', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Threshold FH" />,
    cell: (item) => <p className="flex justify-center">{item.getValue() ?? '-'}</p>,
  }),
  ch.accessor('threshold_fc', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Threshold FC" />,
    cell: (item) => <p className="flex justify-center">{item.getValue() ?? '-'}</p>,
  }),
  ch.accessor('threshold_days', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Threshold (días)" />,
    cell: (item) => <p className="flex justify-center">{item.getValue() ?? '-'}</p>,
  }),
  ch.accessor('repeat_fh', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Repeat FH" />,
    cell: (item) => <p className="flex justify-center">{item.getValue() ?? '-'}</p>,
  }),
  ch.accessor('repeat_fc', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Repeat FC" />,
    cell: (item) => <p className="flex justify-center">{item.getValue() ?? '-'}</p>,
  }),
  ch.accessor('repeat_days', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Repeat (días)" />,
    cell: (item) => <p className="flex justify-center">{item.getValue() ?? '-'}</p>,
  }),
  ch.accessor('task_cards_count', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="# Tareas" />,
    cell: (item) => <p className="flex justify-center">{item.getValue() ?? 0}</p>,
  }),
  ch.display({
    id: 'actions',
    cell: ({ row }) => {
      return <MaintenanceServiceDropdownActions service={row.original} />;
    },
  }),
];
