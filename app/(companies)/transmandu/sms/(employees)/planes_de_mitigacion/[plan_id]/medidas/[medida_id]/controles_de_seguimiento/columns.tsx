"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/tables/DataTableHeader";

import DocumentDisplayDialog from "@/components/dialogs/DocumentDisplayDialog";
import FollowUpControlDropdownActions from "@/components/misc/FollowUpControlDropdownActions";
import { Button } from "@/components/ui/button";
import { FollowUpControl } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ImageDisplayDialog from "@/components/dialogs/ImageDisplayDialog";

export const columns: ColumnDef<FollowUpControl>[] = [

  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Observacion" />
    ),
    meta: { title: "Control de Segumiento" },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center">{row.original.description}</div>
      );
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Fecha del Control" />
    ),
    meta: { title: "Fecha de Control" },
    cell: ({ row }) => {
      return (
        <p className="font-medium text-center">
          {format(row.original.date, "PPP", {
            locale: es,
          })}
        </p>
      );
    },
  },
  {
    accessorKey: "document",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Documento" />
    ),
    meta: { title: "Documento" },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center items-center">
          {row.original?.document &&
          typeof row.original?.document === "string" ? (
            <DocumentDisplayDialog base64Document={row.original.document} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className=" hidden h-8 lg:flex"
              disabled={true}
            >
              Sin Documento
            </Button>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "image",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Imagen" />
    ),
    meta: { title: "Imagen" },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center items-center">
          {row.original?.image && typeof row.original?.image === "string" ? (
            <ImageDisplayDialog base64Image={row.original.image} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className=" hidden h-8 lg:flex"
              disabled={true}
            >
              Sin imagen
            </Button>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const FollowUpControl = row.original;
      return (
        <FollowUpControlDropdownActions followUpControl={FollowUpControl} />
      );
    },
  },
];
