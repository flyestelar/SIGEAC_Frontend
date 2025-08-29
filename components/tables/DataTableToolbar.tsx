"use client"

import { Table } from "@tanstack/react-table"
import { Package2, PaintBucket, Wrench } from "lucide-react"

import { Input } from "../ui/input"
import { DataTableFacetedFilter } from "./DataTableFacetedFilter"
import { DataTableViewOptions } from "./DataTableViewOptions"
interface DataTableToolbarProps<TData> {
    table: Table<TData>
}
const categories = [
    {
        value: "componente",
        label: "Componentes",
        icon: Package2,
    },
    {
        value: "consumible",
        label: "Consumibles",
        icon: PaintBucket,
    },
    {
        value: "herramienta",
        label: "Herramientas",
        icon: Wrench,
    }
]

export function DataTableToolbar<TData>({
    table,
}: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0

    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex flex-1 items-center space-x-2">
                {table.getColumn("category") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("category")}
                        title="Categoría"
                        options={categories}
                    />
                )}
            </div>
            <DataTableViewOptions table={table} />
        </div>
    )
}