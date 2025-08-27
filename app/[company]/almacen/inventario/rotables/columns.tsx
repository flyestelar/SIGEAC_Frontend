"use client"

import { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/tables/DataTableHeader"

import BatchDropdownActions from "@/components/dropdowns/mantenimiento/almacen/BatchDropdownActions"
import { cn } from "@/lib/utils"
import { Batch } from "@/types"
import Link from "next/link"

export const columns: ColumnDef<Batch>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Nombre" />
    ),
    cell: ({ row }) => {
      return (
        <Link href={`/estelar/general/inventario/${row.original.slug}`} className="font-medium flex justify-center hover:scale-105 hover:text-blue-600 transition-all ease-in cursor-pointer duration-150">{row.original.name}</Link>
      )
    }
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Descripción" />
    ),
    cell: ({ row }) => (
      <p className="flex justify-center text-muted-foreground">{row.original.description}</p>
    )
  },
  {
    accessorKey: "min_quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cantidad Mínima" />
    ),
    cell: ({ row }) => (
      <p className="flex text-center font-bold justify-center">{row.original.min_quantity} - {row.original.unit.label}</p>
    )
  },
  {
    accessorKey: "article_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cantidad de Stock" />
    ),
    cell: ({ row }) => (
      <p className={cn("flex justify-center rounded-lg", Number(row.original.min_quantity) > Number(row.original.article_count) ? "bg-red-300 text-white" : "bg-green-200")}>{row.original.article_count}</p>
    )
  },
  {
    accessorKey: "warehouse_name",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Ubicacion" />
    ),
    cell: ({ row }) => (
      <p className="flex justify-center font-medium">{row.original.warehouse_name}</p>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const batch = row.original
      return (
        <BatchDropdownActions id={batch.id} />
      )
    },
  },
]
