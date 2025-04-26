"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Plane,  PlaneIcon, } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useGetCreditStatisticsFlights } from "@/hooks/administracion/creditos/useGetCreditStatisticsFlights"

const CreditStatisticsFlightPage = () => {
  const router = useRouter()
  const { data, isLoading, isError } = useGetCreditStatisticsFlights()
  const [showCreditsTable, setShowCreditsTable] = useState(false)
  const [activeBar, setActiveBar] = useState<string | null>(null)

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Handle error state
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">Error al cargar los datos</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    )
  }

  // Verificar la estructura de datos y procesarla adecuadamente
  const processedData = Array.isArray(data) ? data : [data]

  // Agregar datos de todas las respuestas
  const aggregatedData = {
    credits: processedData.flatMap((item) => item.credits || []),
    pending_credits: processedData.flatMap((item) => item.pending_credits || []),
    payed_credits: processedData.flatMap((item) => item.payed_credits || []),
    credits_payed_amount: processedData.reduce((sum, item) => sum + (item.credits_payed_amount || 0), 0),
    credits_debt_amount: processedData.reduce((sum, item) => sum + (item.credits_debt_amount || 0), 0),
    credits_total_amount: processedData.reduce((sum, item) => sum + (item.credits_total_amount || 0), 0),
  }

  // Preparar datos para el gráfico - solo montos
  const chartData = [
    {
      name: "",
      montoTotal: aggregatedData.credits_total_amount,
      montoPagado: aggregatedData.credits_payed_amount,
      montoDeuda: aggregatedData.credits_debt_amount,
    },
  ]

  // Función para manejar el clic en la barra
  const handleBarClick = (dataKey: string) => {
    setActiveBar(dataKey)
    setShowCreditsTable(true)
  }

  // Colores para las barras
  const barColors = {
    montoTotal: "#3b82f6", // Blue-500
    montoPagado: "#14b8a6", // Teal-500
    montoDeuda: "#6366f1", // Indigo-500
  }

  // Obtener los créditos filtrados según la barra seleccionada
  const getFilteredCredits = () => {
    if (!activeBar) return aggregatedData.credits

    switch (activeBar) {
      case "montoTotal":
        return aggregatedData.credits
      case "montoPagado":
        return aggregatedData.payed_credits
      case "montoDeuda":
        return aggregatedData.pending_credits
      default:
        return aggregatedData.credits
    }
  }

  // Obtener el título de la tabla según la barra seleccionada
  const getTableTitle = () => {
    switch (activeBar) {
      case "montoTotal":
        return "Detalle de Todos los Créditos de Vuelos"
      case "montoPagado":
        return "Detalle de Créditos de Vuelos Pagados"
      case "montoDeuda":
        return "Detalle de Créditos de Vuelos Pendientes"
      default:
        return "Detalle de Créditos de Vuelos"
    }
  }

  // Obtener la descripción de la tabla según la barra seleccionada
  const getTableDescription = () => {
    switch (activeBar) {
      case "montoTotal":
        return "Lista de todos los créditos de vuelos registrados"
      case "montoPagado":
        return "Lista de créditos de vuelos que han sido pagados completamente"
      case "montoDeuda":
        return "Lista de créditos de vuelos con pagos pendientes"
      default:
        return "Lista de créditos de vuelos"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div>
            <CardTitle className="text-center">ESTADÍSTICAS DE CRÉDITO DE LOS VUELOS</CardTitle>
            <CardDescription className="text-center">
              Resumen estadístico sobre los créditos de los vuelos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Créditos</p>
                    <h3 className="text-2xl font-bold">{aggregatedData.credits.length}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Plane className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Créditos Pagados</p>
                    <h3 className="text-2xl font-bold">{aggregatedData.payed_credits.length}</h3>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-full">
                    <Plane className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Créditos Pendientes</p>
                    <h3 className="text-2xl font-bold">{aggregatedData.pending_credits.length}</h3>
                  </div>
                  <div className="p-2 bg-amber-500/10 rounded-full">
                    <Plane className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de barras */}
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="70%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                barSize={40} // Barras más delgadas
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  label={{ value: "Montos ($)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    return [
                      formatCurrency(value as number),
                      name === "montoTotal" ? "Monto Total" : name === "montoPagado" ? "Monto Pagado" : "Monto Deuda",
                    ]
                  }}
                />
                <Legend
                  formatter={(value) => {
                    switch (value) {
                      case "montoTotal":
                        return "Monto Total"
                      case "montoPagado":
                        return "Monto Pagado"
                      case "montoDeuda":
                        return "Monto Deuda"
                      default:
                        return value
                    }
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="montoTotal"
                  fill={barColors.montoTotal}
                  onClick={() => handleBarClick("montoTotal")}
                  cursor="pointer"
                  className={activeBar === "montoTotal" ? "opacity-100" : "opacity-70"}
                />
                <Bar
                  yAxisId="left"
                  dataKey="montoPagado"
                  fill={barColors.montoPagado}
                  onClick={() => handleBarClick("montoPagado")}
                  cursor="pointer"
                  className={activeBar === "montoPagado" ? "opacity-100" : "opacity-70"}
                />
                <Bar
                  yAxisId="left"
                  dataKey="montoDeuda"
                  fill={barColors.montoDeuda}
                  onClick={() => handleBarClick("montoDeuda")}
                  cursor="pointer"
                  className={activeBar === "montoDeuda" ? "opacity-100" : "opacity-70"}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de créditos */}
      {showCreditsTable && (
        <Card>
          <CardHeader>
            <CardTitle>{getTableTitle()}</CardTitle>
            <CardDescription>{getTableDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vuelo (# - Tipo)</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Deuda</TableHead>
                    <TableHead>Monto Pagado</TableHead>
                    <TableHead>Fecha Límite</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredCredits().map((credit) => (
                    <TableRow key={credit.id}>
                      <TableCell className="font-medium">{credit.client?.name || "N/A"}</TableCell>
                      <TableCell>
                        {credit.flight ? (
                           <div className="flex items-center gap-2">
                           <div className="flex flex-col">
                             <span className="font-medium flex items-center gap-1">
                               <PlaneIcon className="h-4 w-4 text-blue-500" /> {/* Icono en lugar del texto "Vuelo" */}
                               {credit.flight.flight_number} {/* Número de vuelo directamente */}
                             </span>
                             <span className="text-xs text-muted-foreground">
                               {credit.flight.type} - {new Date(credit.flight.date).toLocaleDateString()}
                             </span>
                           </div>
                         </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            credit.status === "PAGADO" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {credit.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(credit.debt)}</TableCell>
                      <TableCell>{formatCurrency(credit.payed_amount)}</TableCell>
                      <TableCell>{formatDate(credit.deadline,1)}</TableCell>
                      <TableCell>{(credit.details)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => setShowCreditsTable(false)}>
              Cerrar
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

export default CreditStatisticsFlightPage