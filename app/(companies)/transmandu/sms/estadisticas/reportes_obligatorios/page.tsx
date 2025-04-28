"use client";
import BarChartComponent from "@/components/charts/BarChartComponent";
import PieChartComponent from "@/components/charts/PieChartComponent";
import { ContentLayout } from "@/components/layout/ContentLayout";
import DataFilter from "@/components/misc/DataFilter";
import { Label } from "@/components/ui/label";
import { useGetDangerIdentificationsCountedByType } from "@/hooks/sms/useGetDangerIdentificationsCountedByType";
import { useGetPostRiskCountByDateRange } from "@/hooks/sms/useGetPostRiskByDateRange";
import { useGetRiskCountByDateRange } from "@/hooks/sms/useGetRiskByDateRange";
import { useGetVoluntaryReportingStatsByYear } from "@/hooks/sms/useGetVoluntaryReportingStatisticsByYear";
import { useGetVoluntaryReportsCountedByAirportLocation } from "@/hooks/sms/useGetVoluntaryReportsCountedByAirportLocation";
import { Loader2, Check, ChevronsUpDown, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DynamicBarChart from "../../../../../../components/charts/DynamicBarChart";
import { format, startOfMonth } from "date-fns";
import { useGetIdentificationStatsBySourceName } from "@/hooks/sms/useGetIdentificationStatsBySoruceName";
import { useGetIdentificationStatsBySourceType } from "@/hooks/sms/useGetIdentificationStatsBySoruceType";
import { useGetReportsCountedByArea } from "@/hooks/sms/useGetReportsCountedByArea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Params {
  from?: string;
  to?: string;
  [key: string]: string | undefined;
}

const graphicsOptions = [
  {
    id: "Todos",
    label: "Todos los gráficos",
    description: "Mostrar todos los gráficos disponibles",
  },
  {
    id: "location",
    label: "Identificados por localizacion",
    description: "Número de reportes por ubicación en el aeropuerto",
  },
  {
    id: "tipo",
    label: "Según su Tipo",
    description: "Número de reportes clasificados por tipo de peligro",
  },
  {
    id: "pre-riesgo",
    label: "Por Índice de Riesgo Pre-Mitigación",
    description:
      "Distribución de reportes por nivel de riesgo antes de mitigación",
  },
  {
    id: "post-riesgo",
    label: "Por Índice de Riesgo Post-Mitigación",
    description:
      "Distribución de reportes por nivel de riesgo después de mitigación",
  },
  {
    id: "bar-chart",
    label: "Identificados vs Gestionados",
    description: "Comparación entre reportes identificados y gestionados",
  },
  {
    id: "pre-riesgo-bar",
    label: "Número de Reportes por Índice de Riesgo",
    description: "Cantidad de reportes por nivel de riesgo pre-mitigación",
  },
  {
    id: "post-riesgo-bar",
    label: "Número de Reportes por Índice de Riesgo",
    description: "Cantidad de reportes por nivel de riesgo post-mitigación",
  },
  {
    id: "area-bar",
    label: "Número de Reportes vs Área",
    description: "Distribución de reportes por área responsable",
  },
  {
    id: "fuente-id",
    label: "Reportes vs Fuente de identificación",
    description: "Número de reportes por fuente de identificación",
  },
  {
    id: "metodo-id",
    label: "Reportes vs Método de identificación",
    description: "Número de reportes por método de detección",
  },
];

const Statistics = () => {
  const [selectedGraphics, setSelectedGraphics] = useState<string[]>(["Todos"]);
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [params, setParams] = useState<Params>({
    from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  });

  // Hooks de datos
  const {
    data: barChartData,
    isLoading: isLoadingBarChart,
    refetch: refetchBarChart,
  } = useGetVoluntaryReportingStatsByYear(
    params.from!,
    params.to!,
    "voluntary"
  );

  const {
    data: dynamicData,
    isLoading: isLoadingDynamicData,
    refetch: refetchDynamicChart,
  } = useGetDangerIdentificationsCountedByType(
    params.from!,
    params.to!,
    "voluntary"
  );

  const {
    data: pieCharData,
    isLoading: isLoadingPieCharData,
    refetch: refetchPieChart,
  } = useGetReportsCountedByArea(params.from!, params.to!, "voluntary");

  const {
    data: riskData,
    isLoading: isLoadingRisk,
    refetch: refetchRisk,
  } = useGetRiskCountByDateRange(params.from!, params.to!, "voluntary");

  const {
    data: postRiskData,
    isLoading: isLoadingPostRisk,
    refetch: refetchPostRisk,
  } = useGetPostRiskCountByDateRange(params.from!, params.to!, "voluntary");

  const {
    data: reportsByLocationData,
    isLoading: isLoadingReportsByLocationData,
    refetch: refetchAirportLocationData,
  } = useGetVoluntaryReportsCountedByAirportLocation(params.from!, params.to!);

  const {
    data: reportsBySourceName,
    isLoading: isLoadingSourceName,
    refetch: refetchDynamicSourceNameChart,
  } = useGetIdentificationStatsBySourceName(
    params.from!,
    params.to!,
    "voluntary"
  );

  const {
    data: reportsBySourceType,
    isLoading: isLoadingSourceType,
    refetch: refetchDynamicSourceTypeChart,
  } = useGetIdentificationStatsBySourceType(
    params.from!,
    params.to!,
    "voluntary"
  );

  useEffect(() => {
    const defaultFrom = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const defaultTo = format(new Date(), "yyyy-MM-dd");

    const newParams: Params = {};
    searchParams.forEach((value, key) => {
      newParams[key] = value;
    });

    setParams({
      from: newParams.from || defaultFrom,
      to: newParams.to || defaultTo,
    });
  }, [searchParams, pathname]);

  useEffect(() => {
    const refetchFunctions = [
      refetchBarChart,
      refetchPieChart,
      refetchDynamicChart,
      refetchRisk,
      refetchPostRisk,
      refetchAirportLocationData,
      refetchDynamicSourceNameChart,
      refetchDynamicSourceTypeChart,
    ];

    refetchFunctions.forEach((refetch) => refetch());
  }, [params]);

  const handleSelectChange = (id: string) => {
    if (id === "Todos") {
      setSelectedGraphics(["Todos"]);
    } else {
      setSelectedGraphics((prev) => {
        // Si ya está seleccionado, lo removemos
        if (prev.includes(id)) {
          const newSelection = prev.filter((item) => item !== id);
          return newSelection.length === 0 ? ["Todos"] : newSelection;
        }
        // Si no está seleccionado, lo agregamos y removemos "Todos" si está presente
        const newSelection = [...prev.filter((item) => item !== "Todos"), id];
        return newSelection;
      });
    }
  };

  const removeGraphic = (id: string) => {
    setSelectedGraphics((prev) => {
      const newSelection = prev.filter((item) => item !== id);
      return newSelection.length === 0 ? ["Todos"] : newSelection;
    });
  };

  const shouldShow = (id: string) =>
    selectedGraphics.includes("Todos") || selectedGraphics.includes(id);

  return (
    <ContentLayout title="Gráficos Estadísticos de los Reportes (Obligatorios)">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-center items-center">
          <div className="flex flex-col w-full max-w-md">
            <Label className="text-lg font-semibold mb-2">
              Seleccionar Rango de Fechas:
            </Label>
            <DataFilter />
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Label className="text-lg font-semibold">
            Seleccionar Gráficos a Mostrar:
          </Label>
          <div className="flex flex-col md:flex-row gap-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isOpen}
                  className="w-full justify-between"
                >
                  {selectedGraphics.includes("Todos") ? (
                    <span>Todos los gráficos</span>
                  ) : selectedGraphics.length > 0 ? (
                    <span>
                      {selectedGraphics.length} gráfico
                      {selectedGraphics.length !== 1 ? "s" : ""} seleccionado
                      {selectedGraphics.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    "Seleccionar gráficos..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar gráficos..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron gráficos</CommandEmpty>
                    <CommandGroup>
                      {graphicsOptions.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.id}
                          onSelect={() => handleSelectChange(option.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedGraphics.includes(option.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={() => setSelectedGraphics(["Todos"])}
              disabled={
                selectedGraphics.length === 1 &&
                selectedGraphics.includes("Todos")
              }
            >
              Limpiar selección
            </Button>
          </div>
        </div>

        {!selectedGraphics.includes("Todos") && selectedGraphics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedGraphics.map((graphicId) => {
              const graphic = graphicsOptions.find((g) => g.id === graphicId);
              return (
                <Badge
                  key={graphicId}
                  variant="outline"
                  className="px-3 py-1 text-sm flex items-center gap-2"
                >
                  {graphic?.label}
                  <button
                    onClick={() => removeGraphic(graphicId)}
                    className="rounded-full p-1 hover:bg-gray-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        {shouldShow("bar-chart") && (
          <div className="p-4 rounded-lg shadow border">
            {isLoadingBarChart ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="size-24 animate-spin" />
              </div>
            ) : barChartData ? (
              <BarChartComponent
                from={params.from!}
                to={params.to!}
                height="100%"
                width="100%"
                data={barChartData}
                title="Peligros Identificados vs Gestionados"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Ha ocurrido un error al cargar los datos.
              </p>
            )}
          </div>
        )}

        {shouldShow("tipo") && (
          <div className="p-4 rounded-lg shadow border">
            {isLoadingDynamicData ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="size-24 animate-spin" />
              </div>
            ) : dynamicData?.length ? (
              <DynamicBarChart
                height="100%"
                width="100%"
                data={dynamicData}
                title="Número de Reportes vs Tipo de Peligros"
              />
            ) : (
              <p className="text-lg text-muted-foreground">
                No hay datos para mostrar.
              </p>
            )}
          </div>
        )}

        {shouldShow("area-bar") && (
          <div className="p-4 rounded-lg shadow border">
            {isLoadingPieCharData ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="size-24 animate-spin" />
              </div>
            ) : pieCharData?.length ? (
              <DynamicBarChart
                height="100%"
                width="100%"
                data={pieCharData}
                title="Número de Reportes vs Áreas"
              />
            ) : (
              <p className="text-lg text-muted-foreground">
                No hay datos para mostrar.
              </p>
            )}
          </div>
        )}

        {shouldShow("location") && (
          <div className="p-4 rounded-lg shadow border">
            {isLoadingReportsByLocationData ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="size-24 animate-spin" />
              </div>
            ) : reportsByLocationData?.length ? (
              <DynamicBarChart
                height="100%"
                width="100%"
                data={reportsByLocationData}
                title="Número de Reportes vs Localización"
              />
            ) : (
              <p className="text-lg text-muted-foreground">
                No hay datos para mostrar.
              </p>
            )}
          </div>
        )}

        {shouldShow("pre-riesgo") && (
          <div className="p-4 rounded-lg shadow border">
            {isLoadingRisk ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="size-24 animate-spin" />
              </div>
            ) : riskData?.length ? (
              <PieChartComponent
                radius={120}
                height="50%"
                width="50%"
                data={riskData}
                title="Porcentaje de Índice de Riesgo Pre-Mitigación"
              />
            ) : (
              <p className="text-lg text-muted-foreground">
                No hay datos para mostrar.
              </p>
            )}
          </div>
        )}

        {shouldShow("pre-riesgo-bar") && (
          <div className="p-4 rounded-lg shadow border">
            {isLoadingRisk ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="size-24 animate-spin" />
              </div>
            ) : riskData?.length ? (
              <DynamicBarChart
                height="100%"
                width="100%"
                data={riskData}
                title="Número de Reportes por Cada Índice de Riesgo"
              />
            ) : (
              <p className="text-lg text-muted-foreground">
                No hay datos para mostrar.
              </p>
            )}
          </div>
        )}

        {shouldShow("post-riesgo") && (
          <div className="p-4 rounded-lg shadow border">
            {isLoadingPostRisk ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="size-24 animate-spin" />
              </div>
            ) : postRiskData?.length ? (
              <PieChartComponent
                radius={120}
                height="50%"
                width="50%"
                data={postRiskData}
                title="Índice de Riesgo Post-Mitigación"
              />
            ) : (
              <p className="text-lg text-muted-foreground">
                No hay datos para mostrar.
              </p>
            )}
          </div>
        )}

        {shouldShow("post-riesgo-bar") && (
          <div className="p-4 rounded-lg shadow border">
            {isLoadingPostRisk ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="size-24 animate-spin" />
              </div>
            ) : postRiskData?.length ? (
              <DynamicBarChart
                height="100%"
                width="100%"
                data={postRiskData}
                title="Número de Reportes por Cada Índice de Riesgo"
              />
            ) : (
              <p className="text-lg text-muted-foreground">
                No hay datos para mostrar.
              </p>
            )}
          </div>
        )}

        {shouldShow("fuente-id") && (
          <div className="p-4 rounded-lg shadow border">
            {isLoadingSourceName ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="size-24 animate-spin" />
              </div>
            ) : reportsBySourceName?.length ? (
              <DynamicBarChart
                height="100%"
                width="100%"
                data={reportsBySourceName}
                title="Reportes vs Fuente de Identificación"
              />
            ) : (
              <p className="text-lg text-muted-foreground">
                No hay datos para mostrar.
              </p>
            )}
          </div>
        )}

        {shouldShow("metodo-id") && (
          <div className="p-4 rounded-lg shadow border">
            {isLoadingSourceType ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="size-24 animate-spin" />
              </div>
            ) : reportsBySourceType?.length ? (
              <DynamicBarChart
                height="100%"
                width="100%"
                data={reportsBySourceType}
                title="Reportes vs Método de Identificación"
              />
            ) : (
              <p className="text-lg text-muted-foreground">
                No hay datos para mostrar.
              </p>
            )}
          </div>
        )}
      </div>
    </ContentLayout>
  );
};

export default Statistics;
