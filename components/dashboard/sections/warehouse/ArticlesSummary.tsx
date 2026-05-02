'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { WarehouseDashboard } from '@/types'
import { Package, Boxes, AlertTriangle } from 'lucide-react'

interface Props { data?: WarehouseDashboard; isLoading: boolean; isError: boolean }

/* =========================
   CARD TINTADO (CYAN)
   ========================= */
function TintedCard({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: string
}) {
  return (
    <Card
      className="relative overflow-hidden rounded-3xl border bg-background/70 backdrop-blur-xl shadow-sm"
      style={{
        borderColor: `rgba(${tone}, 0.22)`,
        backgroundImage: `linear-gradient(to bottom right, rgba(${tone}, 0.06), transparent 60%)`,
      }}
    >
      {children}
    </Card>
  )
}

/* =========================
   TOOLTIP ESTILO UNIFICADO
   ========================= */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null

  const data = payload[0]

  return (
    <div className="rounded-xl border bg-background/90 backdrop-blur-xl shadow-lg px-4 py-3 min-w-[180px]">
      <p className="text-center font-semibold text-sm mb-2 text-slate-700 dark:text-slate-200">
        {data?.payload?.name}
      </p>

      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600 dark:text-slate-300">
          En total
        </span>
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          {data?.value ?? 0}
        </span>
      </div>
    </div>
  )
}

export default function ArticlesSummary({ data, isLoading, isError }: Props) {
  if (isLoading) return <div className="text-center text-cyan-600 py-8">Cargando información...</div>
  if (isError || !data) return <div className="text-center text-red-500 py-8">Error al cargar información.</div>

  const cyanTone = "6,182,212"

  /* =========================
     COLORES ALINEADOS CON KPIs
     ========================= */
  const chartData = [
    {
      name: 'Salidas Totales',
      value: data.dispatchCount,
      color: 'url(#indigoDispatch)'
    },
    {
      name: 'Salidas a Aeronaves',
      value: data.dispatchAircraftCount,
      color: 'url(#cyanIncoming)'
    },
    {
      name: 'Salidas a Taller',
      value: data.dispatchWorkOrderCount,
      color: 'url(#violetWorkOrder)'
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* IZQUIERDA */}
      <div className="flex flex-col gap-6">

        {/* KPIs */}
        <TintedCard tone={cyanTone}>
          <CardHeader className="pb-2 text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
                <Package className="size-5" />
              </div>
            </div>

            <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Resumen de Artículos
            </CardTitle>
            <CardDescription className="mx-auto max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Resumen semanal basado en registros creados en el sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 text-center">

              <div>
                <div className="text-3xl font-bold bg-gradient-to-b from-sky-600 to-cyan-500 bg-clip-text text-transparent">
                  {data.storedCount ?? 0}%
                </div>
                <p className="text-sm text-slate-500">Artículos Activos</p>
              </div>

              <div>
                <div className="text-3xl font-bold bg-gradient-to-b from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  {data.dispatchCount ?? 0}
                </div>
                <p className="text-sm text-slate-500">Salidas Totales</p>
              </div>

              <div>
                <div className="text-3xl font-bold bg-gradient-to-b from-slate-700 to-slate-500 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                  {data.dispatchAircraftCount ?? 0}
                </div>
                <p className="text-sm text-slate-500">Salidas a Aeronaves</p>
              </div>

              <div>
                <div className="text-3xl font-bold bg-gradient-to-b from-amber-600 to-orange-500 bg-clip-text text-transparent">
                  {data.dispatchWorkOrderCount ?? 0}
                </div>
                <p className="text-sm text-slate-500">Salidas a Taller</p>
              </div>

            </div>
          </CardContent>
        </TintedCard>

        {/* TABLA (sin cambios) */}
        <TintedCard tone={cyanTone}>
          <CardHeader className="pb-2 text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
                <Boxes className="size-5" />
              </div>
            </div>

            <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Artículos Fuera de Stock
            </CardTitle>

            <CardDescription className="mx-auto max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Listado de artículos sin disponibilidad<br />
              Cantidad de artículos por reabastecer: {data.restockCount ?? 0}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="overflow-hidden rounded-xl border border-cyan-100/40 dark:border-cyan-900/20">
              <div className="overflow-y-auto max-h-[220px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/80 backdrop-blur">
                    <TableRow>
                      <TableHead className="text-center">Descripción</TableHead>
                      <TableHead className="text-center">Part Number</TableHead>
                      <TableHead className="text-center">Categoría</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data.articlesOutOfStock?.length ? data.articlesOutOfStock.map(item => (
                      <TableRow key={item.id} className="hover:bg-cyan-50/30 dark:hover:bg-cyan-950/20 transition-colors">
                        <TableCell className="max-w-[180px] truncate text-center">{item.description}</TableCell>
                        <TableCell className="text-center">{item.part_number}</TableCell>
                        <TableCell className="text-center">{item.category}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-slate-500 py-4">
                          No hay artículos fuera de stock
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </TintedCard>

      </div>

      {/* GRÁFICO */}
      <TintedCard tone={cyanTone} >
        <CardHeader className="text-center pb-4 space-y-3">
          <div className="flex justify-center">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
              <AlertTriangle className="size-5" />
            </div>
          </div>

          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Gráfico de Salidas
          </CardTitle>
          <CardDescription className="mx-auto max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Comparativa de tipos de despacho (Esta semana)
          </CardDescription>
        </CardHeader>

        <CardContent className="h-[400px] pt-10 pb-8 px-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>

            <defs>

              <linearGradient id="indigoDispatch" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                <stop offset="100%" stopColor="#818CF8" stopOpacity={0.6} />
              </linearGradient>

              <linearGradient id="cyanIncoming" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={1} />
                <stop offset="100%" stopColor="#67E8F9" stopOpacity={0.6} />
              </linearGradient>

              <linearGradient id="violetWorkOrder" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.6} />
              </linearGradient>
            </defs>

              <XAxis
                dataKey="name"
                tickMargin={10}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />

              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>

            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </TintedCard>

    </div>
  )
}