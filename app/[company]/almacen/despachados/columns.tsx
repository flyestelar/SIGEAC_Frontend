"use client"

import { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/tables/DataTableHeader"

import DispatchArticlesDialog from "@/components/dialogs/mantenimiento/almacen/DispatchArticlesDialog"
import PendingDispatchRequestDropdownActions from "@/components/dropdowns/mantenimiento/almacen/PendingDispatchRequestDropdownActions"
import { Checkbox } from "@/components/ui/checkbox"
import { DispachedArticles } from "@/hooks/mantenimiento/almacen/salidas_entradas/useGetDispatchedArticles"
import { format, formatDate } from "date-fns"
import { es } from "date-fns/locale"
import DispatchedArticlesDropdownActions from "@/components/dropdowns/mantenimiento/almacen/DispatchedArticlesDropdownActions"



export const columns: ColumnDef<DispachedArticles>[] = [
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
    accessorKey: "batch_name",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Nombre" />
    ),
    cell: ({ row }) => {
      return (
        <p className="font-medium text-center">{row.original.batch_name}</p>
      )
    }
  },
  {
    accessorKey: "articles",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Componente" />
    ),
    cell: ({ row }) => {
      return (
        <p className="font-medium text-center">{row.original.articles.map((article) => (
          <span key={article.id}>{article.part_number} - {article.serial} ({article.quantity})</span>
        ))}</p>
      )
    }
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Destino" />
    ),
    cell: ({ row }) => {
      return (
        <p className="font-medium text-center">{format(row.original.date, "PPP", { locale: es })}</p>
      )
    }
  },
  {
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Destino" />
    ),
    cell: ({ row }) => {
      return (
        <DispatchedArticlesDropdownActions id={row.original.articles[0].id} />
      )
    }
  }
]
