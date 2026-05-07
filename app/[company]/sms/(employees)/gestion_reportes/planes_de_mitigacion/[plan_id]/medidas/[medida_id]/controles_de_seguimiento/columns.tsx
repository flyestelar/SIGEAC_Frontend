"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/tables/DataTableHeader";

import DocumentDisplayDialog from "@/components/dialogs/sms/DocumentDisplayDialog";
import ImageDisplayDialog from "@/components/dialogs/sms/ImageDisplayDialog";
import FollowUpControlDropdownActions from "@/components/dropdowns/sms/FollowUpControlDropdownActions";
import { Button } from "@/components/ui/button";
import { FollowUpControl } from "@/types";
import { es } from "date-fns/locale";
import { format, parseISO } from "date-fns";

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
      const rawDate = row.original.date;

      if (!rawDate) return <p className="text-center">-</p>;

      const dateString = String(rawDate as unknown);

      const parsedDate = parseISO(dateString);

      const year = parsedDate.getUTCFullYear();
      const month = parsedDate.getUTCMonth();
      const day = parsedDate.getUTCDate();

      const normalizedDate = new Date(year, month, day);

      return (
        <p className="font-medium text-center">
          {format(normalizedDate, "PPP", {
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
          (typeof row.original?.document === "string") ? (
            <DocumentDisplayDialog fileName={row.original.document} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="hidden h-8 lg:flex"
              disabled={true}
            >
              Sin documento
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
            <ImageDisplayDialog fileName={row.original.image} />
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
    accessorKey: "sms_activity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actividad Vinculada" />
    ),
    meta: { title: "Actividad Vinculada" },
    cell: ({ row }) => {
      const activity = row.original.sms_activity;
      if (!activity)
        return <p className="text-center text-muted-foreground">—</p>;
      return (
        <div className="flex flex-col items-center text-center gap-0.5">
          <span className="font-mono text-xs text-muted-foreground">
            {activity.activity_number}
          </span>
          <span className="text-sm font-medium">
            {activity.title || activity.activity_name}
          </span>
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
