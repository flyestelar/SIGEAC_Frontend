"use client"

import { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/tables/DataTableHeader"

import QuoteDropdownActions from "@/components/dropdowns/mantenimiento/compras/QuoteDropdownActions"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Quote } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"

/**
 * Given a quote's article list, compute the most frequent vendor name
 * and the full list of unique vendor names.
 */
function getVendorSummary(quote: Quote) {
  const articles = quote.article_quote_order ?? []

  // Collect vendor names from article-level vendors
  const vendorNames: string[] = []
  const vendorFreq: Record<string, number> = {}

  for (const article of articles) {
    const name = article.vendor?.name
    if (name) {
      vendorNames.push(name)
      vendorFreq[name] = (vendorFreq[name] || 0) + 1
    }
  }

  // If no article-level vendors, fall back to header vendor
  if (vendorNames.length === 0) {
    const headerName = quote.vendor?.name
    return { primaryVendor: headerName ?? 'N/A', uniqueVendors: headerName ? [headerName] : [], extraCount: 0 }
  }

  // Find the most frequent vendor
  const sortedVendors = Object.entries(vendorFreq).sort((a, b) => b[1] - a[1])
  const primaryVendor = sortedVendors[0][0]
  const uniqueVendors = Array.from(new Set(vendorNames))
  const extraCount = uniqueVendors.length - 1

  return { primaryVendor, uniqueVendors, extraCount }
}

export const columns: ColumnDef<Quote>[] = [
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
    accessorKey: "quote_number",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Nro. de Cotizacion" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex justify-center">
          <Link href={`/estelar/compras/cotizaciones/${row.original.quote_number}`} className="font-bold text-center hover:italic hover:scale-110 transition-all">{row.original.quote_number}</Link>
        </div>
      )
    }
  },
  {
    accessorKey: "requisition_order",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nro. de Requisicion" />
    ),
    cell: ({ row }) => {
      return (
        <p className="font-medium text-center">{row.original.requisition_order.order_number ?? "N/A"}</p>
      )
    }
  },
  {
    accessorKey: "purchase_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha" />
    ),
    cell: ({ row }) => (
      <p className="flex justify-center text-muted-foreground italic">{format(row.original.quote_date, "PPP", {
        locale: es
      })}</p>
    )
  },
  {
    accessorKey: "vendor",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Proveedor" />
    ),
    cell: ({ row }) => {
      const { primaryVendor, uniqueVendors, extraCount } = getVendorSummary(row.original)

      if (extraCount <= 0) {
        return <p className="font-medium text-center">{primaryVendor}</p>
      }

      return (
        <div className="flex items-center justify-center gap-1.5">
          <p className="font-medium text-sm">{primaryVendor}</p>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-muted-foreground/30 bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                +{extraCount} mas
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-[240px] p-3" align="center" side="bottom">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Proveedores
              </p>
              <ul className="space-y-1">
                {uniqueVendors.map((name) => (
                  <li key={name} className="text-sm font-medium">{name}</li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        </div>
      )
    }
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const process = row.original.status === 'PENDIENTE'
      const aproved = row.original.status === 'APROBADO'
      return (
        <Badge className={cn("flex justify-center", process ? "bg-yellow-500" : aproved ? "bg-green-500" : "bg-red-500")} > {row.original.status.toUpperCase()}</Badge >
      )
    }
  },
  {
    accessorKey: "articles",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Articulos" />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span>Total de {row.original.article_quote_order.length} articulo(s)</span>
      </div>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <QuoteDropdownActions quote={row.original} />
      )
    },
  },
]
