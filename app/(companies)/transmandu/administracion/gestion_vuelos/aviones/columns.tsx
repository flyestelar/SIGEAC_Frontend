"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/tables/DataTableHeader";
import { Aircraft } from "@/types";
import AircraftDropdownActions from "@/components/misc/AircraftDropdownActions";

export const columns: ColumnDef<Aircraft>[] = [
  {
    accessorKey: "serial",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Serial" />
    ),
    meta: { title: "Serial" },
    cell: ({ row }) => (
      <div className="flex justify-center font-bold">{row.original.serial}</div>
    ),
  },
  {
    accessorKey: "acronym",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Placa" />
    ),
    meta: { title: "Matrícula" },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="text-muted-foreground italic">
          {row.original.acronym}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "model",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Modelo" />
    ),
    meta: { title: "Modelo" },
    cell: ({ row }) => (
      <div className="flex justify-center font-bold">{row.original.model}</div>
    ),
  },
  {
    accessorKey: "location.address",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Ubicación" />
    ),
    meta: { title: "Ubicación" },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="text-muted-foreground italic">
          {row.original.location.address}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "owner",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Dueño" />
    ),
    meta: { title: "Dueño" },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="text-muted-foreground italic">
          {row.original.owner}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "brand",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Marca" />
    ),
    meta: { title: "Marca" },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="text-muted-foreground italic">
          {row.original.brand}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "fabricant",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Fabricante" />
    ),
    meta: { title: "Fabricante" },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="text-muted-foreground italic">
          {row.original.fabricant}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "fabricant_date",
    header: ({ column }) => (
      <DataTableColumnHeader
        filter
        column={column}
        title="Fecha de Fabricación"
      />
    ),
    meta: { title: "Fecha de Fabricación" },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="text-muted-foreground italic">
          {row.original.fabricant}
        </span>
      </div>
    ),
  },
  
  {
    accessorKey: "comments",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Comentarios" />
    ),
    meta: { title: "Comentarios" },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="text-muted-foreground italic">
          {row.original.comments}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id;
      return <AircraftDropdownActions id={row.original.id.toString()} />;
    },
  },
];
