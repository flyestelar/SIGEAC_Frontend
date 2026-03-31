"use client";

import { useState, useMemo } from "react";
import {
  FileDown,
  FileUp,
  BookOpen,
  Clock,
  Gauge,
  Calendar,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TasksAdminTable } from "./_components/tasks-admin-table";
import { useQuery } from "@tanstack/react-query";
import { taskCardsIndexOptions } from "@api/queries";
import type { TaskCardResource } from "@api/types";
import { ContentLayout } from "@/components/layout/ContentLayout";

const STAT_CONFIG = [
  {
    key: "total" as const,
    label: "TOTAL TAREAS",
    icon: ListChecks,
    accent: "text-foreground",
    iconBg: "bg-muted/30 border-border",
    iconText: "text-muted-foreground",
  },
  {
    key: "fh" as const,
    label: "FLIGHT HOURS",
    icon: Clock,
    accent: "text-sky-500",
    iconBg: "bg-sky-500/10 border-sky-500/30",
    iconText: "text-sky-500",
  },
  {
    key: "fc" as const,
    label: "FLIGHT CYCLES",
    icon: Gauge,
    accent: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/30",
    iconText: "text-emerald-500",
  },
  {
    key: "calendar" as const,
    label: "CALENDARIO",
    icon: Calendar,
    accent: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/30",
    iconText: "text-amber-500",
  },
] as const;

export default function TasksAdminPage() {
  const { data: response, isLoading } = useQuery(taskCardsIndexOptions());
  const tasks = response?.data ?? [];
  const [selectedMpd, setSelectedMpd] = useState<string>("all");

  const mpdList = useMemo(() => {
    const mpds = new Set<string>();
    tasks.forEach((task) => {
      if (task.manual_reference) {
        mpds.add(task.manual_reference);
      }
    });
    return Array.from(mpds).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (selectedMpd === "all") return tasks;
    return tasks.filter((task) => task.manual_reference === selectedMpd);
  }, [tasks, selectedMpd]);

  const stats = useMemo(
    () => ({
      total: filteredTasks.length,
      fh: filteredTasks.filter((t) => t.interval_fh != null && t.interval_fh !== "").length,
      fc: filteredTasks.filter((t) => t.interval_fc != null && t.interval_fc !== "").length,
      calendar: filteredTasks.filter((t) => t.interval_days != null && t.interval_days !== "").length,
    }),
    [filteredTasks],
  );

  const getTaskCountByMpd = (mpd: string) => {
    return tasks.filter((t) => t.manual_reference === mpd).length;
  };

  const handleEdit = (task: TaskCardResource) => {
    // TODO: implementar edición
  };

  const handleDeleteClick = (task: TaskCardResource) => {
    // TODO: implementar eliminación
  };

  const handleView = (task: TaskCardResource) => {
    // TODO: implementar vista detalle
  };

  return (
    <ContentLayout title="Control de Tareas">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Administración de Tareas
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona las tarjetas de tarea de mantenimiento programado
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <FileUp className="h-3.5 w-3.5" />
              Importar
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileDown className="h-3.5 w-3.5" />
              Exportar
            </Button>
          </div>
        </div>

        {/* MPD filter strip */}
        <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-2.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded border bg-muted/30">
              <BookOpen className="h-3 w-3" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Manual
            </span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedMpd("all")}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedMpd === "all"
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-500"
                  : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              Todos
              <Badge
                variant="secondary"
                className="h-4 min-w-[1rem] rounded px-1 text-[10px] font-semibold leading-none"
              >
                {tasks.length}
              </Badge>
            </button>
            {mpdList.map((mpd) => (
              <button
                key={mpd}
                onClick={() => setSelectedMpd(mpd)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedMpd === mpd
                    ? "border-sky-500/30 bg-sky-500/10 text-sky-500"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {mpd}
                <Badge
                  variant="secondary"
                  className="h-4 min-w-[1rem] rounded px-1 text-[10px] font-semibold leading-none"
                >
                  {getTaskCountByMpd(mpd)}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {STAT_CONFIG.map(({ key, label, icon: Icon, accent, iconBg, iconText }) => (
            <div
              key={key}
              className="flex items-center gap-4 rounded-lg border bg-background px-5 py-4"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${iconBg}`}
              >
                <Icon className={`h-4 w-4 ${iconText}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <p className={`text-2xl font-semibold tabular-nums tracking-tight ${accent}`}>
                  {stats[key]}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Table container */}
        <div className="overflow-hidden rounded-lg border bg-background">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-foreground">Listado de Tareas</h2>
              {selectedMpd !== "all" && (
                <Badge
                  variant="outline"
                  className="border-sky-500/30 bg-sky-500/10 text-[11px] font-semibold text-sky-500"
                >
                  {selectedMpd}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedMpd === "all"
                ? "Todas las tareas de mantenimiento configuradas"
                : `Filtrado por ${selectedMpd}`}
            </p>
          </div>
          <TasksAdminTable
            tasks={filteredTasks}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onView={handleView}
          />
        </div>
      </div>
    </ContentLayout>
  );
}
