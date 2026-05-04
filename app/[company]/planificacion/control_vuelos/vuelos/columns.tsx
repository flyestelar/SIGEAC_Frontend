"use client"

import { useState } from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/tables/DataTableHeader"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FlightControl } from "@/types"
import { ArrowRight, Hash, MapPin, Clock, Repeat2, Calendar, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import CreateFlightControlForm from "@/components/forms/mantenimiento/ordenes_trabajo/CreateFlightControlForm"
import { useDeleteFlightControl } from "@/actions/planificacion/vuelos/actions"
import { useCompanyStore } from "@/stores/CompanyStore"

function formatDate(value?: string | Date | null) {
  if (!value) return "N/D"
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return "N/D"
  return d.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "2-digit" })
}

function FlightControlDropdownActions({ flightControl }: { flightControl: FlightControl }) {
  const [editOpen, setEditOpen] = useState(false)
  const { selectedCompany } = useCompanyStore()
  const { deleteFlightControl } = useDeleteFlightControl()

  const flightDataForForm = {
    id: flightControl.id,
    flight_number: flightControl.flight_number,
    aircraft_operator: flightControl.aircraft_operator,
    origin: flightControl.origin,
    destination: flightControl.destination,
    flight_date: flightControl.flight_date,
    departure_time: flightControl.departure_time,
    arrival_time: flightControl.arrival_time,
    flight_hours: Number(flightControl.flight_hours),
    flight_cycles: Number(flightControl.flight_cycles),
    aircraft_id: String(flightControl.aircraft?.id ?? ""),
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={deleteFlightControl.isPending}
            onClick={() =>
              deleteFlightControl.mutate({
                id: flightControl.id,
                company: selectedCompany!.slug,
              })
            }
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Editar Vuelo</DialogTitle>
            <DialogDescription>
              Modifica los datos del vuelo registrado.
            </DialogDescription>
          </DialogHeader>
          <CreateFlightControlForm
            flightData={flightDataForForm}
            onClose={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export const getColumns = (companySlug: string): ColumnDef<FlightControl>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todos"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "flight_number",
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Vuelo" />,
    cell: ({ row }) => {
      const n = row.original.flight_number
      const href = `/${companySlug}/planificacion/control_vuelos/vuelos/${n}`
      return (
        <div className="flex items-center justify-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <Button asChild variant="link" className="h-auto p-0 font-medium">
            <Link href={href} className="font-mono text-sm">
              {n ?? "-"}
            </Link>
          </Button>
        </div>
      )
    },
  },
  {
    id: "route",
    accessorFn: (row) => `${row.origin ?? ""} ${row.destination ?? ""}`,
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Ruta" />,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline" className="font-mono font-normal">
          {row.original.origin || "N/D"}
        </Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline" className="font-mono font-normal">
          {row.original.destination || "N/D"}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "flight_date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>{formatDate(row.original.flight_date)}</span>
      </div>
    ),
  },
  {
    id: "flight_hours",
    accessorFn: (row) => Number(row.flight_hours ?? 0),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Horas" />,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium tabular-nums">{Number(row.original.flight_hours ?? 0).toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">h</span>
      </div>
    ),
  },
  {
    id: "flight_cycles",
    accessorFn: (row) => Number(row.flight_cycles ?? 0),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ciclos" />,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <Repeat2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium tabular-nums">{Number(row.original.flight_cycles ?? 0)}</span>
      </div>
    ),
  },
  {
    accessorKey: "aircraft_operator",
    header: ({ column }) => <DataTableColumnHeader filter column={column} title="Operador" />,
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.aircraft_operator ? (
          <Badge variant="secondary" className="font-normal">
            {row.original.aircraft_operator}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">N/D</span>
        )}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <FlightControlDropdownActions flightControl={row.original} />
      </div>
    ),
    size: 60,
  },
]
