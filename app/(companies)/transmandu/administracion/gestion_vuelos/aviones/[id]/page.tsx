"use client";

import { useParams } from "next/navigation";
import { useGetAircraftById } from "@/hooks/administracion/useGetAircraftById";
import { useGetAircraftStatistics } from "@/hooks/administracion/vuelos/useGetAircraftStatistics";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, DollarSign, Calendar, Plane, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { SummaryCard } from "@/components/cards/SummaryCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import months, { getMonthByNumber } from "@/components/cards/ConfigMonths";
import type { CashMovement } from "@/types";

type MonthlyData = {
  name: string;
  shortName: string;
  ingresos: number;
  egresos: number;
  vuelos: number;
  month: string;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: MonthlyData;
  }>;
  label?: string;
}

export default function AircraftReportPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: aircraftDetails, isLoading, error } = useGetAircraftById(id);
  const { data: aircraftStats } = useGetAircraftStatistics(id);
  
  // Mejorado: Obtener años combinados de ingresos y egresos
  const availableYears = useMemo(() => {
    if (!aircraftStats?.statistics) {
      return [new Date().getFullYear().toString()];
    }

    // Obtener años de ingresos
    const incomeYears = aircraftStats.statistics.monthly_income 
      ? Object.keys(aircraftStats.statistics.monthly_income) 
      : [];
    
    // Obtener años de egresos
    const outputYears = aircraftStats.statistics.monthly_output 
      ? Object.keys(aircraftStats.statistics.monthly_output) 
      : [];

    // Combinar y eliminar duplicados
    const allYears = Array.from(new Set(incomeYears.concat(outputYears)));
    
    // Ordenar de más reciente a más antiguo
    return allYears.sort((a, b) => Number.parseInt(b) - Number.parseInt(a));
  }, [aircraftStats]);

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return availableYears[0] || new Date().getFullYear().toString();
  });
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [selectedMovementType, setSelectedMovementType] = useState<"income" | "output" | null>(null);
  const [movementDetails, setMovementDetails] = useState<CashMovement[]>([]);

  useEffect(() => {
    if (aircraftStats) {
      const yearIncomeData = aircraftStats.statistics.monthly_income[selectedYear] || {};
      const yearOutputData = aircraftStats.statistics.monthly_output[selectedYear] || {};
      const processedData = months.map((month) => {
        const monthNameInSpanish = month.name;
        const monthIncome = yearIncomeData[monthNameInSpanish] || 0;
        const monthOutput = yearOutputData[monthNameInSpanish] || 0;
        const flightsCount = 0;

        return {
          name: month.name,
          shortName: month.short,
          ingresos: monthIncome,
          egresos: monthOutput,
          vuelos: flightsCount,
          month: month.number,
        };
      });
      setMonthlyData(processedData);
      setSelectedMonth(null);
      setSelectedMovementType(null);
      setMovementDetails([]);
    }
  }, [selectedYear, aircraftStats]);

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload) {
      const clickedBar = data.activePayload[0];
      const monthNumber = clickedBar.payload.month;
      const dataKey = clickedBar.dataKey;

      setSelectedMonth(monthNumber);

      const monthObj = months.find((m) => m.number === monthNumber);
      const monthNameInSpanish = monthObj?.name || "";

      if (dataKey === "ingresos") {
        setSelectedMovementType("income");
        const monthIncomes = aircraftStats?.incomes[selectedYear]?.[monthNameInSpanish] || [];
        setMovementDetails(monthIncomes as CashMovement[]);
      } else if (dataKey === "egresos") {
        setSelectedMovementType("output");
        const monthOutputs = aircraftStats?.outputs[selectedYear]?.[monthNameInSpanish] || [];
        setMovementDetails(monthOutputs as CashMovement[]);
      } else {
        setSelectedMovementType(null);
        setMovementDetails([]);
      }
    }
  };

  const totalIncome = useMemo(() => {
    return aircraftStats?.statistics?.total_annual_income?.[selectedYear] || 0;
  }, [aircraftStats, selectedYear]);

  const totalExpense = useMemo(() => {
    return aircraftStats?.statistics?.total_annual_output?.[selectedYear] || 0;
  }, [aircraftStats, selectedYear]);

  const totalFlights = useMemo(() => {
    return aircraftStats?.statistics?.total_flights?.[selectedYear] || 0;
  }, [aircraftStats, selectedYear]);

  const bestMonth =
    monthlyData.length > 0
      ? monthlyData.reduce((prev, current) => (prev.ingresos > current.ingresos ? prev : current))
      : null;

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-lg mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="mb-1">
              {entry.dataKey === "ingresos" && (
                <p className="text-emerald-600 font-medium text-base">Ingresos: {formatCurrency(entry.value)}</p>
              )}
              {entry.dataKey === "egresos" && (
                <p className="text-red-600 font-medium text-base">Egresos: {formatCurrency(entry.value)}</p>
              )}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !aircraftDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">Error al cargar los datos de la aeronave</p>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-center">Reporte Monetario</h1>
          <p className="text-muted-foreground text-center">
            {aircraftDetails?.acronym} - {aircraftDetails?.model}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <SummaryCard
          title="Total Ingresos"
          value={formatCurrency(totalIncome)}
          description="Ingresos totales del año"
          icon={<ArrowUpCircle className="h-5 w-5 text-emerald-500" />}
        />

        <SummaryCard
          title="Total Egresos"
          value={formatCurrency(totalExpense)}
          description="Egresos totales del año"
          icon={<ArrowDownCircle className="h-5 w-5 text-red-500" />}
        />

        <SummaryCard
          title="Balance"
          value={formatCurrency(totalIncome - totalExpense)}
          description="Diferencia ingresos - egresos"
          icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
        />

        <SummaryCard
          title="Total Vuelos"
          value={totalFlights.toString()}
          description="Número de vuelos realizados"
          icon={<Plane className="h-5 w-5 text-blue-500" />}
        />

        <SummaryCard
          title="Mejor Mes"
          value={bestMonth?.name || "-"}
          description={bestMonth ? formatCurrency(bestMonth.ingresos) : "$0"}
          icon={<Calendar className="h-5 w-5 text-purple-500" />}
        />
      </div>

      <div className="flex justify-end mb-4">
        <Select value={selectedYear} onValueChange={setSelectedYear} disabled={availableYears.length <= 1}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccionar año" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mb-6 overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-center">Ingresos vs Egresos Mensuales {selectedYear}</CardTitle>
          <CardDescription className="text-center">
            Haz clic en una barra para ver los detalles de los movimientos
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                onClick={handleBarClick}
                barGap={0}
                barCategoryGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="shortName"
                  tickLine={false}
                  axisLine={true}
                  tick={{ fontSize: 12 }}
                  height={60}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  width={80}
                  domain={[0, "auto"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-ingresos-${index}`}
                      fill={entry.month === selectedMonth && selectedMovementType === "income" ? "#047857" : "#10b981"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
                <Bar yAxisId="left" dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-egresos-${index}`}
                      fill={entry.month === selectedMonth && selectedMovementType === "output" ? "#b91c1c" : "#ef4444"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {selectedMonth !== null && selectedMovementType && (
        <Card>
          <CardHeader className="bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedMovementType === "income"
                    ? `Ingresos de ${getMonthByNumber(selectedMonth)?.name} ${selectedYear}`
                    : `Egresos de ${getMonthByNumber(selectedMonth)?.name} ${selectedYear}`}
                </CardTitle>
                <CardDescription>
                  {selectedMovementType === "income"
                    ? "Detalle de los ingresos registrados durante el mes"
                    : "Detalle de los egresos registrados durante el mes"}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm py-1.5 px-3">
                {`${movementDetails.length} movimientos`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {movementDetails.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Detalle</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Caja</TableHead>
                      {selectedMovementType === "income" ? (
                        <TableHead>Cliente</TableHead>
                      ) : (
                        <TableHead>Proveedor</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementDetails.map((movement: CashMovement) => (
                      <TableRow key={movement.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{formatDate(movement.date,1)}</TableCell>
                        <TableCell>
                          {movement.category} - {movement.sub_category}
                          {movement.sub_category_details && ` (${movement.sub_category_details})`}
                        </TableCell>
                        <TableCell
                          className={`font-medium ${selectedMovementType === "income" ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {formatCurrency(movement.amount)}
                        </TableCell>
                        <TableCell>{movement.cash?.name || movement.cash_id || "-"}</TableCell>
                        <TableCell>
                          {selectedMovementType === "income" 
                            ? movement.client?.name || "-"
                            : movement.vendor?.name || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay {selectedMovementType === "income" ? "ingresos" : "egresos"} registrados para este mes.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}