"use client";

import { useState } from "react";
import {
  Clock,
  Gauge,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { TaskCardResource } from "@api/types";

type IntervalType = "FH" | "FC" | "Calendar";

const INTERVAL_CONFIG: Record<
  IntervalType,
  { label: string; icon: typeof Clock; border: string; bg: string; text: string }
> = {
  FH: {
    label: "Flight Hours",
    icon: Clock,
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
    text: "text-sky-500",
  },
  FC: {
    label: "Flight Cycles",
    icon: Gauge,
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
  },
  Calendar: {
    label: "Calendar",
    icon: Calendar,
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
  },
};

function getIntervalType(task: TaskCardResource): IntervalType | null {
  if (task.interval_fh) return "FH";
  if (task.interval_fc) return "FC";
  if (task.interval_days) return "Calendar";
  return null;
}

function getIntervalValue(task: TaskCardResource): string {
  return `${task.interval_fh}h` || `${task.interval_fc} cyc` || `${task.interval_days} dys` || "";
}

interface TasksAdminTableProps {
  tasks: TaskCardResource[];
  onEdit: (task: TaskCardResource) => void;
  onDelete: (task: TaskCardResource) => void;
  onView: (task: TaskCardResource) => void;
}

type SortField = "code" | "description" | "intervalType" | "intervalValue" | "mpdReference";
type SortDirection = "asc" | "desc";

export function TasksAdminTable({ tasks, onEdit, onDelete, onView }: TasksAdminTableProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredTasks = tasks
    .filter((task) => {
      const q = search.toLowerCase();
      const matchesSearch =
        task.new_task.toLowerCase().includes(q) ||
        task.old_task.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        (task.manual_reference?.toLowerCase().includes(q) ?? false);

      const matchesFilter = filterType === "all" || getIntervalType(task) === filterType;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "code":
          comparison = a.new_task.localeCompare(b.new_task);
          break;
        case "description":
          comparison = a.description.localeCompare(b.description);
          break;
        case "mpdReference":
          comparison = (a.manual_reference || "").localeCompare(b.manual_reference || "");
          break;
        case "intervalType": {
          const typeA = getIntervalType(a) || "";
          const typeB = getIntervalType(b) || "";
          comparison = typeA.localeCompare(typeB);
          break;
        }
        case "intervalValue": {
          const valA = parseFloat(getIntervalValue(a)) || 0;
          const valB = parseFloat(getIntervalValue(b)) || 0;
          comparison = valA - valB;
          break;
        }
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1.5 h-3 w-3 opacity-0 transition-opacity group-hover/th:opacity-40" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1.5 h-3 w-3 text-foreground" />
    ) : (
      <ArrowDown className="ml-1.5 h-3 w-3 text-foreground" />
    );
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b bg-muted/20 px-5 py-3">
        <InputGroup className="max-w-xs">
          <InputGroupAddon>
            <Search className="h-3.5 w-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Buscar por código, descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
          />
        </InputGroup>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-9 w-[160px] text-xs">
            <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Tipo intervalo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="FH">Flight Hours</SelectItem>
            <SelectItem value="FC">Flight Cycles</SelectItem>
            <SelectItem value="Calendar">Calendario</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {filteredTasks.length} de {tasks.length} tareas
        </span>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              className="group/th w-[180px] cursor-pointer select-none px-5 text-center"
              onClick={() => handleSort("code")}
            >
              <div className="flex items-center justify-center text-[11px] font-semibold uppercase tracking-widest">
                Código
                <SortIndicator field="code" />
              </div>
            </TableHead>
            <TableHead
              className="group/th cursor-pointer select-none text-center"
              onClick={() => handleSort("description")}
            >
              <div className="flex items-center justify-center text-[11px] font-semibold uppercase tracking-widest">
                Descripción
                <SortIndicator field="description" />
              </div>
            </TableHead>
            <TableHead
              className="group/th w-[160px] cursor-pointer select-none text-center"
              onClick={() => handleSort("intervalType")}
            >
              <div className="flex items-center justify-center text-[11px] font-semibold uppercase tracking-widest">
                Tipo
                <SortIndicator field="intervalType" />
              </div>
            </TableHead>
            <TableHead
              className="group/th w-[100px] cursor-pointer select-none text-center"
              onClick={() => handleSort("intervalValue")}
            >
              <div className="flex items-center justify-center text-[11px] font-semibold uppercase tracking-widest">
                Valor
                <SortIndicator field="intervalValue" />
              </div>
            </TableHead>
            <TableHead
              className="group/th w-[140px] cursor-pointer select-none text-center"
              onClick={() => handleSort("mpdReference")}
            >
              <div className="flex items-center justify-center text-[11px] font-semibold uppercase tracking-widest">
                Referencia
                <SortIndicator field="mpdReference" />
              </div>
            </TableHead>
            <TableHead className="w-[48px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-sm text-muted-foreground">No se encontraron tareas</p>
                  {search && (
                    <p className="text-xs text-muted-foreground/60">
                      Intenta con otro término de búsqueda
                    </p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredTasks.map((task) => {
              const type = getIntervalType(task);
              const cfg = type ? INTERVAL_CONFIG[type] : null;
              const Icon = cfg?.icon;

              return (
                <TableRow key={task.id} className="group/row">
                  <TableCell className="px-5 text-center">
                    <code className="whitespace-nowrap rounded border bg-muted/30 px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                      {task.new_task}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="line-clamp-1 text-sm text-foreground/80">
                      {task.description}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {cfg ? (
                      <Badge
                        variant="outline"
                        className={`gap-1 border ${cfg.border} ${cfg.bg} ${cfg.text} text-[11px] font-semibold`}
                      >
                        {Icon && <Icon className="h-3 w-3" />}
                        {cfg.label}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-sm tabular-nums text-foreground">
                      {getIntervalValue(task) || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs text-muted-foreground">
                      {task.manual_reference || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 transition-opacity group-hover/row:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onView(task)}>
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(task)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(task)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
