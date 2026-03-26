"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetMaintenanceAircraftByAcronym } from "@/hooks/planificacion/useGetMaitenanceAircraftByAcronym";
import { useCompanyStore } from "@/stores/CompanyStore";
import { EditAircraftTypeDialog } from "@/components/dialogs/planificacion/EditAircraftTypeDialog";
import { AircraftAssigment, MaintenanceAircraftPart } from "@/types";
import {
  Calendar,
  Clock,
  Factory,
  FileText,
  Gauge,
  Layers,
  MapPin,
  Plane,
  Puzzle,
  RotateCcw,
  User,
  Wrench,
  Pencil,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import LoadingPage from "@/components/misc/LoadingPage";
import { ContentLayout } from "@/components/layout/ContentLayout";

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
};

// ── Stat mini-card ──────────────────────────────────────────────────────────
const Stat = ({
  icon: Icon,
  label,
  value,
  onEdit,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
}) => (
  <Card className="border-dashed">
    <CardHeader className="py-3 pb-1">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </CardTitle>
        {onEdit && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            aria-label={`Editar ${label}`}
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent className="pb-3">
      <div className="text-xl font-semibold tabular-nums">{value ?? "—"}</div>
    </CardContent>
  </Card>
);

// ── Condition badge ──────────────────────────────────────────────────────────
const ConditionBadge = ({ condition }: { condition?: string | null }) => {
  const c = condition?.toLowerCase() ?? "";
  const variant =
    c === "serviceable" || c === "serviciable"
      ? "default"
      : c.includes("overhauled") || c.includes("oh")
        ? "secondary"
        : c.includes("repair") || c.includes("unserviceable")
          ? "destructive"
          : "outline";
  return <Badge variant={variant as any}>{condition || "—"}</Badge>;
};

// ── Recursive part row ───────────────────────────────────────────────────────
const PartRow = ({
  p,
  depth = 0,
}: {
  p: MaintenanceAircraftPart;
  depth?: number;
}) => {
  const hasChildren = p.sub_parts && p.sub_parts.length > 0;
  return (
    <AccordionItem value={`${p.part_number}-${depth}`} className="border-none">
      <AccordionTrigger className="px-0 hover:no-underline">
        <div className="flex items-start gap-3 w-full" style={{ paddingLeft: depth * 16 }}>
          <div className="flex-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <Puzzle className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{p.part_name || "(Sin nombre)"}</span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {p.part_number || "—"}
              </Badge>
              <ConditionBadge condition={p.condition_type} />
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex gap-4">
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" /> FH: {p.total_flight_hours ?? "—"}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" /> FC: {p.total_flight_cycles ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {hasChildren ? (
          <Accordion type="multiple" className="w-full">
            {p.sub_parts.map((sp, idx) => (
              <PartRow key={`${sp.part_number}-${idx}`} p={sp} depth={depth + 1} />
            ))}
          </Accordion>
        ) : (
          <p className="text-xs text-muted-foreground py-1 pl-7">Sin subcomponentes</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

// ── Assignments table ────────────────────────────────────────────────────────
const AssignmentsTable = ({ rows }: { rows: AircraftAssigment[] }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2">
        <Wrench className="h-4 w-4" /> Historial de instalaciones
      </CardTitle>
      <CardDescription className="text-xs">
        Partes instaladas y retiradas de esta aeronave
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28%]">Parte</TableHead>
              <TableHead>PN</TableHead>
              <TableHead className="hidden md:table-cell">FH @instalación</TableHead>
              <TableHead className="hidden md:table-cell">FC @instalación</TableHead>
              <TableHead>Asignada</TableHead>
              <TableHead>Retirada</TableHead>
              <TableHead className="hidden md:table-cell">Condición</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.aircraft_part.part_name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.aircraft_part.part_number}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.hours_at_installation || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.cycles_at_installation || "—"}</TableCell>
                  <TableCell>{formatDate(r.assigned_date)}</TableCell>
                  <TableCell>
                    {r.removed_date ? (
                      formatDate(r.removed_date)
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Activa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <ConditionBadge condition={r.aircraft_part.condition_type} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Sin registros de instalaciones
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AircraftDetailsPage() {
  const { acronym } = useParams<{ acronym: string }>();
  const { selectedCompany } = useCompanyStore();
  const { data: aircraft, isLoading, isError } = useGetMaintenanceAircraftByAcronym(
    decodeURIComponent(acronym),
    selectedCompany?.slug
  );
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);

  if (isLoading) return <LoadingPage />;

  if (isError || !aircraft) {
    return (
      <ContentLayout title="Aeronave">
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
          <Plane className="size-10 opacity-20" />
          <p className="text-sm">
            No se encontró la aeronave{" "}
            <span className="font-mono font-medium">{decodeURIComponent(acronym)}</span>.
          </p>
        </div>
      </ContentLayout>
    );
  }

  const activeAssignments = (aircraft.aircraft_assignments ?? []).filter(
    (a) => a.removed_date === null
  );

  // Raíces del árbol: partes sin parent, o todas si no hay jerarquía
  const rootParts = Array.from(
    new Map(
      activeAssignments
        .filter((a) => !a.aircraft_part.parent_part_id)
        .map((a) => [a.aircraft_part.part_number, a.aircraft_part])
    ).values()
  );

  return (
    <ContentLayout title={`Aeronave: ${aircraft.acronym}`}>
      <div className="max-w-7xl mx-auto space-y-4">

        {/* ── Header ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 min-w-0">
                <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
                  <Plane className="h-5 w-5 shrink-0" />
                  <span className="font-mono tracking-widest">{aircraft.acronym}</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    S/N: {aircraft.serial || "—"}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Factory className="h-3.5 w-3.5" />
                    {aircraft.manufacturer?.name ?? "—"}
                  </span>
                  <Separator orientation="vertical" className="h-3.5 hidden sm:block" />
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {aircraft.location?.name ?? aircraft.location?.address ?? "—"}
                  </span>
                  <Separator orientation="vertical" className="h-3.5 hidden sm:block" />
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {aircraft.client?.name ?? "—"}
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {aircraft.aircraft_type && (
                  <Badge variant="outline" className="w-fit shrink-0">
                    {aircraft.aircraft_type.full_name}
                  </Badge>
                )}
                <EditAircraftTypeDialog
                  isOpen={isTypeDialogOpen}
                  onOpenChange={setIsTypeDialogOpen}
                  acronym={aircraft.acronym}
                  companySlug={selectedCompany?.slug || ""}
                  currentTypeId={aircraft.aircraft_type?.id}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat
                icon={Clock}
                label="Horas de vuelo"
                value={aircraft.flight_hours?.toLocaleString?.() ?? aircraft.flight_hours}
              />
              <Stat
                icon={RotateCcw}
                label="Ciclos"
                value={aircraft.flight_cycles?.toLocaleString?.() ?? aircraft.flight_cycles}
              />
              <Stat
                icon={Calendar}
                label="Fabricación"
                value={formatDate(aircraft.fabricant_date)}
              />
              <Stat
                icon={Wrench}
                label="Tipo"
                value={aircraft.aircraft_type?.full_name ?? "—"}
                onEdit={() => setIsTypeDialogOpen(true)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Body ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Árbol + historial */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Puzzle className="h-4 w-4" /> Árbol de componentes
                </CardTitle>
                <CardDescription className="text-xs">
                  Estructura jerárquica de partes actualmente instaladas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[360px] pr-4">
                  {rootParts.length ? (
                    <Accordion type="multiple" className="w-full">
                      {rootParts.map((part, idx) => (
                        <PartRow key={`${part.part_number}-${idx}`} p={part} />
                      ))}
                    </Accordion>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                      <Puzzle className="size-8 opacity-20" />
                      <p className="text-sm">No hay partes instaladas</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <AssignmentsTable rows={aircraft.aircraft_assignments ?? []} />
          </div>

          {/* Notas */}
          <div>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Notas
                </CardTitle>
                <CardDescription className="text-xs">
                  Comentarios y observaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aircraft.comments?.trim() ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {aircraft.comments}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin comentarios.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
