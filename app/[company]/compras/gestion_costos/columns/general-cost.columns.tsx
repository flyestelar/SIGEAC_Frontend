'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/tables/DataTableHeader'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import React from 'react'

export type GeneralCostRow = {
  id: number
  description?: string
  brand_model?: string
  variant_type?: string
  cost?: number
}

export type GeneralCostColumnsArgs = {
  costDrafts: Record<number, string | number | undefined>
  onCostChange: (id: number, value: string) => void
}

const isModified = (
  id: number,
  drafts: Record<number, string | number | undefined>,
  current?: number
) => {
  const draft = drafts[id]
  if (draft === undefined) return false
  return Number(draft) !== Number(current ?? 0)
}

export function getGeneralCostColumns({
  costDrafts,
  onCostChange,
}: GeneralCostColumnsArgs): ColumnDef<GeneralCostRow>[] {

  return [
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <div className="flex justify-center text-center w-full max-w-[320px] mx-auto">
          <DataTableColumnHeader filter column={column} title="Descripción" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center text-center w-full">
          <span className="block max-w-[320px] whitespace-normal break-words text-sm font-semibold text-foreground text-center">
            {row.original.description ?? '—'}
          </span>
        </div>
      ),
    },

    {
      accessorKey: 'brand_model',
      header: ({ column }) => (
        <div className="flex justify-center w-full text-center">
          <DataTableColumnHeader column={column} title="Modelo / Marca" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center text-center w-full">
          <span className="block max-w-[240px] whitespace-normal break-words text-sm text-muted-foreground text-center">
            {row.original.brand_model ?? '—'}
          </span>
        </div>
      ),
    },

    {
      accessorKey: 'variant_type',
      header: ({ column }) => (
        <div className="flex justify-center w-full text-center">
          <DataTableColumnHeader column={column} title="Present. / Especif." />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center text-center w-full">
          <span className="block max-w-[240px] whitespace-normal break-words text-sm text-muted-foreground text-center">
            {row.original.variant_type ?? '—'}
          </span>
        </div>
      ),
    },

    {
      accessorKey: 'cost',
      header: ({ column }) => (
        <div className="flex justify-center w-full text-center">
          <DataTableColumnHeader filter column={column} title="Costo Unitario" />
        </div>
      ),

      cell: ({ row }) => {
        const id = row.original.id
        const current = row.original.cost
        const draft = costDrafts[id]

        const modified = isModified(id, costDrafts, current)

        const currentValue =
          current !== undefined && current !== null
            ? String(current)
            : ''

        const draftValue =
          draft !== undefined && draft !== null
            ? String(draft)
            : ''

        return (
          <div className="flex justify-center w-full">
            <div
              className={cn(
                'group flex items-center gap-1.5 rounded-md border px-2 py-1',
                'bg-background/60 backdrop-blur transition-all',
                'hover:border-muted-foreground/40',
                modified
                  ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30'
                  : 'border-border'
              )}
            >
              <span className="text-xs text-muted-foreground">$</span>

              {modified ? (
                <>
                  <span className="text-xs text-muted-foreground line-through tabular-nums">
                    {currentValue}
                  </span>

                  <span className="text-xs text-muted-foreground">→</span>

                  <Input
                    inputMode="decimal"
                    value={draftValue}
                    onChange={(e) => onCostChange(id, e.target.value)}
                    className="h-6 w-16 border-0 bg-transparent p-0 text-sm tabular-nums shadow-none text-center font-medium text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </>
              ) : (
                <Input
                  inputMode="decimal"
                  value={currentValue}
                  onChange={(e) => onCostChange(id, e.target.value)}
                  className="h-6 w-20 border-0 bg-transparent p-0 text-sm tabular-nums shadow-none text-center text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              )}

              {modified && (
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
          </div>
        )
      },
    },
  ]
}