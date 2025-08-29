"use client"

import WarehouseDropdownActions from "@/components/dropdowns/ajustes/WarehouseDropdownActions"
import WorkshopsDropdownActions from "@/components/dropdowns/ajustes/WorkshopsDropdownActions"
import { DataTableColumnHeader } from "@/components/tables/DataTableHeader"
import { Checkbox } from "@/components/ui/checkbox"
import { Workshop } from "@/types"
import { ColumnDef } from "@tanstack/react-table"

export const columns: ColumnDef<Workshop>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Nombre" />
    ),
    cell: ({ row }) =>
      <>
        <span className='font-bold flex justify-center'>{row.original.name ?? "N/A"}</span>
      </>
  },
  {
    accessorKey: "location.address",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Ubicación" />
    ),
    cell: ({ row }) =>
      <>
        <span className="flex justify-center">{row.original.location.address} - {row.original.location.type}</span>
      </>
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id
      return (
        <WorkshopsDropdownActions id={id} />
      )
    },
  },
]
