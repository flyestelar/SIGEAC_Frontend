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

export default function ArticlesSummary({ data, isLoading, isError }: Props) {
  if (isLoading) return <div className="text-center text-cyan-600 py-8">Cargando información...</div>
  if (isError || !data) return <div className="text-center text-red-500 py-8">Error al cargar información.</div>

  const cyanTone = "6,182,212"

  const chartData = [
    { name: 'Salidas\n Totales', value: data.dispatchCount, color: 'url(#gradBlue)' },
    { name: 'Salidas a\n Aeronaves', value: data.dispatchAircraftCount, color: 'url(#gradRose)' },
    { name: 'Salidas a\n Taller', value: data.dispatchWorkOrderCount, color: 'url(#gradAmber)' },
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

            <CardTitle className="text-2xl font-semibold">Resumen de Artículos</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">Resumen semanal basado en registros creados en el sistema</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 text-center">

              <div>
                <div className="text-3xl font-bold bg-gradient-to-b from-indigo-500 to-violet-400 bg-clip-text text-transparent">{data.storedCount ?? 0}%</div>
                <p className="text-sm text-slate-500">Artículos Activos</p>
              </div>

              <div>
                <div className="text-3xl font-bold bg-gradient-to-b from-emerald-500 to-teal-400 bg-clip-text text-transparent">{data.dispatchCount ?? 0}</div>
                <p className="text-sm text-slate-500">Salidas Totales</p>
              </div>

              <div>
                <div className="text-3xl font-bold bg-gradient-to-b from-fuchsia-500 to-pink-400 bg-clip-text text-transparent">{data.dispatchAircraftCount ?? 0}</div>
                <p className="text-sm text-slate-500">Salidas a Aeronaves</p>
              </div>

              <div>
                <div className="text-3xl font-bold bg-gradient-to-b from-amber-500 to-orange-400 bg-clip-text text-transparent">{data.dispatchWorkOrderCount ?? 0}</div>
                <p className="text-sm text-slate-500">Salidas a Taller</p>
              </div>

            </div>
          </CardContent>
        </TintedCard>

        {/* TABLA */}
        <TintedCard tone={cyanTone}>
          <CardHeader className="pb-2 text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
                <Boxes className="size-5" />
              </div>
            </div>

            <CardTitle className="text-2xl font-semibold">Artículos Fuera de Stock</CardTitle>

            <CardDescription className="text-slate-500 dark:text-slate-400">
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
                        <TableCell colSpan={3} className="text-center text-slate-500 py-4">No hay artículos fuera de stock</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </TintedCard>
      </div>

      {/* DERECHA */}
      <TintedCard tone={cyanTone}>
        <CardHeader className="text-center pb-2 space-y-2">
          <div className="flex justify-center">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
              <AlertTriangle className="size-5" />
            </div>
          </div>

          <CardTitle className="text-2xl font-semibold">Gráfico de Salidas</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">Comparativa de tipos de despacho (Esta semana)</CardDescription>
        </CardHeader>

        <CardContent className="flex justify-center items-center h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>

              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.6} />
                </linearGradient>

                <linearGradient id="gradRose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity={0.6} />
                </linearGradient>

                <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity={0.6} />
                </linearGradient>
              </defs>

              <XAxis dataKey="name"
                tick={({ x, y, payload }) => (
                  <text x={x} y={y + 10} textAnchor="middle" fontSize={12}>
                    {payload.value.split('\n').map((line: string, i: number) => (
                      <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>{line}</tspan>
                    ))}
                  </text>
                )}
              />

              <YAxis />
              <Tooltip />

              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
              </Bar>

            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </TintedCard>

    </div>
  )
}