"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/tables/DataTableHeader";

import ObligatoryReportDropdownActions from "@/components/dropdowns/sms/ObligatoryReportDropdownActions";
import { Badge } from "@/components/ui/badge";
import { dateFormat } from "@/lib/utils";
import { ObligatoryReportResource } from "@/.gen/api/types.gen";

export const columns: ColumnDef<ObligatoryReportResource>[] = [
  {
    accessorKey: "report_number",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Nro. de Reporte" />
    ),
    meta: { title: "Nro. de Reporte" },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center">
          {row.original.report_number ? (
            <p>ROS-{row.original.report_number}</p>
          ) : (
            "N/A"
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "report_date",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Fecha del reporte" />
    ),
    cell: ({ row }) => {
      return (
        <p className="font-medium text-center">
          {row.original.report_date
            ? dateFormat(row.original.report_date, "PPP")
            : "N/A"}
        </p>
      );
    },
  },
  {
    accessorKey: "incident_date",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Fecha del incidente" />
    ),
    cell: ({ row }) => {
      return (
        <p className="font-medium text-center">
          {row.original.incident_date
            ? dateFormat(row.original.incident_date, "PPP")
            : "N/A"}
        </p>
      );
    },
  },
  {
    accessorKey: "incident_location",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Lugar del incidente" />
    ),
    cell: ({ row }) => (
      <p className="font-medium text-center">
        {row.original.incident_location || "N/A"}
      </p>
    ),
  },
  {
    accessorKey: "danger_type",
    header: ({ column }) => (
      <DataTableColumnHeader filter column={column} title="Tipo de peligro" />
    ),
    cell: ({ row }) => (
      <p className="flex justify-center text-muted-foreground italic">
        {row.original.danger_type || "N/A"}
      </p>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Badge
          className={`justify-center items-center text-center font-bold font-sans
      ${
        row.original.status === "CERRADO"
          ? "bg-green-400"
          : row.original.status === "ABIERTO"
          ? "bg-gray-500"
          : "bg-red-400"
      }`}
        >
          {row.original.status}
        </Badge>
      </div>
    ),
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const obligatoryReport = row.original;
      return (
        <ObligatoryReportDropdownActions
          obligatoryReport={obligatoryReport}
        />
      );
    },
  },
];
