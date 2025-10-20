'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { Clock, Plane, AlertTriangle, Route as RouteIcon } from 'lucide-react';

// ---------- Datos mock ----------
const today = new Date('2025-10-18');

// Aeronaves
const aircraft = [
  { id: 1, tail: 'YV568T', model: 'Cessna 450', status: 'Activa', hours: 12.3, cycles: 5, base: 'PMV' },
  { id: 2, tail: 'YV432K', model: 'Cessna 208B', status: 'Activa', hours: 9.8, cycles: 7, base: 'PMV' },
  { id: 3, tail: 'YV774A', model: 'ATR 42', status: 'Mantenimiento', hours: 0.0, cycles: 0, base: 'CCS' },
  { id: 4, tail: 'YV902M', model: 'B1900D', status: 'Standby', hours: 1.2, cycles: 1, base: 'PMV' },
];

// Vuelos recientes (últimos 10)
const recentFlights = [
  { id: 'FL-1001', date: '2025-10-18 07:10', tail: 'YV568T', route: 'PMV-CCS', block: 1.1, cycles: 1, otp: true },
  { id: 'FL-1002', date: '2025-10-18 09:30', tail: 'YV432K', route: 'PMV-POS', block: 2.0, cycles: 1, otp: false },
  { id: 'FL-0991', date: '2025-10-17 17:40', tail: 'YV568T', route: 'CCS-PMV', block: 1.1, cycles: 1, otp: true },
  { id: 'FL-0990', date: '2025-10-17 15:05', tail: 'YV432K', route: 'POS-PMV', block: 2.0, cycles: 1, otp: true },
  { id: 'FL-0989', date: '2025-10-17 11:10', tail: 'YV568T', route: 'PMV-BLA', block: 0.7, cycles: 1, otp: true },
  { id: 'FL-0988', date: '2025-10-17 08:00', tail: 'YV432K', route: 'PMV-POZ', block: 0.9, cycles: 1, otp: true },
  { id: 'FL-0987', date: '2025-10-16 17:20', tail: 'YV568T', route: 'BLA-PMV', block: 0.8, cycles: 1, otp: false },
  { id: 'FL-0986', date: '2025-10-16 14:00', tail: 'YV902M', route: 'PMV-PMV', block: 0.5, cycles: 1, otp: true },
  { id: 'FL-0985', date: '2025-10-16 09:15', tail: 'YV432K', route: 'PMV-PMV', block: 0.6, cycles: 1, otp: true },
  { id: 'FL-0984', date: '2025-10-15 16:10', tail: 'YV568T', route: 'PMV-CCS', block: 1.1, cycles: 1, otp: true },
];

// Próximos servicios por aeronave
const upcomingServices = [
  { tail: 'YV568T', type: 'A-check', dueHours: 25, dueCycles: null, dueDate: '2025-10-25', criticidad: 'media' },
  {
    tail: 'YV432K',
    type: 'Calibración Torquímetro',
    dueHours: null,
    dueCycles: null,
    dueDate: '2025-10-20',
    criticidad: 'alta',
  },
  { tail: 'YV774A', type: 'C-check', dueHours: 120, dueCycles: 90, dueDate: '2025-11-03', criticidad: 'alta' },
  {
    tail: 'YV902M',
    type: 'Lubricación tren',
    dueHours: 10,
    dueCycles: null,
    dueDate: '2025-10-22',
    criticidad: 'media',
  },
];

// Horas por día por flota (14 días)
const fleetHours = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() - (13 - i));
  return {
    date: d.toISOString().slice(0, 10),
    horas: +(0.5 + Math.random() * 6).toFixed(1),
  };
});

// Rutas más voladas (YTD)
const topRoutes = [
  { route: 'PMV-CCS', flights: 142 },
  { route: 'CCS-PMV', flights: 139 },
  { route: 'PMV-POS', flights: 88 },
  { route: 'POS-PMV', flights: 86 },
  { route: 'PMV-BLA', flights: 64 },
  { route: 'BLA-PMV', flights: 62 },
];

// Estado flota
const fleetStatus = [
  { name: 'Activa', value: aircraft.filter((a) => a.status === 'Activa').length },
  { name: 'Mantenimiento', value: aircraft.filter((a) => a.status === 'Mantenimiento').length },
  { name: 'Standby', value: aircraft.filter((a) => a.status === 'Standby').length },
];

// KPI
const activeAircraft = fleetStatus.find((s) => s.name === 'Activa')?.value || 0;
const totalHours14d = fleetHours.reduce((a, c) => a + c.horas, 0).toFixed(1);
const totalCyclesRecent = recentFlights.reduce((a, c) => a + c.cycles, 0);
const otpRate = Math.round((recentFlights.filter((f) => f.otp).length / recentFlights.length) * 100);

// Chart configs
const cfgFleetHours: ChartConfig = { horas: { label: 'Horas', color: 'hsl(var(--chart-2))' } };
const cfgTopRoutes: ChartConfig = { flights: { label: 'Vuelos', color: 'hsl(var(--chart-1))' } };

export default function PlanificacionFlotaMock() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Planificación · Flota</h1>
          <p className="text-sm text-muted-foreground">Mock de planificación, vuelos y servicios</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Programar servicio
          </Button>
          <Button size="sm">Crear vuelo</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Aeronaves activas</CardDescription>
            <CardTitle className="text-2xl">{activeAircraft}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground flex items-center gap-2">
            <Plane className="h-4 w-4" />
            Operativas hoy
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Horas últimos 14 días</CardDescription>
            <CardTitle className="text-2xl">{totalHours14d}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">Acumuladas flota</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Ciclos vuelos recientes</CardDescription>
            <CardTitle className="text-2xl">{totalCyclesRecent}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">10 últimos vuelos</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>OTP</CardDescription>
            <CardTitle className="text-2xl">{otpRate}%</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            On Time Performance
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="vuelos">Últimos vuelos</TabsTrigger>
          <TabsTrigger value="rutas">Rutas</TabsTrigger>
          <TabsTrigger value="aeronaves">Aeronaves</TabsTrigger>
          <TabsTrigger value="servicios">Próximos servicios</TabsTrigger>
        </TabsList>

        {/* Resumen */}
        <TabsContent value="resumen">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardHeader className="pb-0">
                <CardTitle>Horas diarias flota</CardTitle>
                <CardDescription>Últimos 14 días</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ChartContainer config={cfgFleetHours} className="h-[280px] w-full">
                  <LineChart data={fleetHours} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(v) => new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    />
                    <YAxis width={40} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="horas" stroke="var(--color-horas)" dot={false} strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-0">
                <CardTitle>Estado de flota</CardTitle>
                <CardDescription>Conteo por estado</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center pt-4">
                <PieChart width={260} height={260}>
                  <Pie data={fleetStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                    {fleetStatus.map((_, i) => (
                      <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                    ))}
                  </Pie>
                </PieChart>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Últimos vuelos */}
        <TabsContent value="vuelos">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Últimos vuelos</CardTitle>
              <CardDescription>10 más recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[340px] pr-2">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="text-left">
                      <th className="py-2">Vuelo</th>
                      <th className="py-2">Fecha</th>
                      <th className="py-2">Matrícula</th>
                      <th className="py-2">Ruta</th>
                      <th className="py-2">Block</th>
                      <th className="py-2">Ciclos</th>
                      <th className="py-2">OTP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFlights.map((f) => (
                      <tr key={f.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{f.id}</td>
                        <td className="py-2">{f.date}</td>
                        <td className="py-2">{f.tail}</td>
                        <td className="py-2 flex items-center gap-1">
                          <RouteIcon className="h-3 w-3" />
                          {f.route}
                        </td>
                        <td className="py-2">{f.block.toFixed(1)} h</td>
                        <td className="py-2">{f.cycles}</td>
                        <td className="py-2">
                          {f.otp ? (
                            <Badge variant="secondary">On time</Badge>
                          ) : (
                            <Badge variant="destructive">Delay</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rutas */}
        <TabsContent value="rutas">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Rutas más voladas</CardTitle>
              <CardDescription>Año en curso</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer config={cfgTopRoutes} className="h-[300px] w-full">
                <BarChart data={topRoutes} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="route" type="category" width={110} tickLine={false} axisLine={false} />
                  <XAxis type="number" hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="flights" fill="var(--color-flights)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aeronaves */}
        <TabsContent value="aeronaves">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Inventario de aeronaves</CardTitle>
              <CardDescription>Horas, ciclos y estado</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="text-left">
                    <th className="py-2">Matrícula</th>
                    <th className="py-2">Modelo</th>
                    <th className="py-2">Base</th>
                    <th className="py-2">Horas hoy</th>
                    <th className="py-2">Ciclos hoy</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {aircraft.map((a) => (
                    <tr key={a.tail} className="border-b last:border-0">
                      <td className="py-2 font-medium">{a.tail}</td>
                      <td className="py-2">{a.model}</td>
                      <td className="py-2">{a.base}</td>
                      <td className="py-2">{a.hours.toFixed(1)} h</td>
                      <td className="py-2">{a.cycles}</td>
                      <td className="py-2">
                        <Badge
                          variant={
                            a.status === 'Activa'
                              ? 'secondary'
                              : a.status === 'Mantenimiento'
                                ? 'destructive'
                                : 'outline'
                          }
                        >
                          {a.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Próximos servicios */}
        <TabsContent value="servicios">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Próximos servicios</CardTitle>
              <CardDescription>Por fecha de vencimiento u horas</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[340px] pr-2">
                <ul className="space-y-3">
                  {upcomingServices
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map((s) => (
                      <li
                        key={`${s.tail}-${s.type}`}
                        className="border rounded-2xl p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            {s.criticidad === 'alta' ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                            <span className="font-medium">{s.type}</span>
                            <Badge variant={s.criticidad === 'alta' ? 'destructive' : 'secondary'}>
                              {s.criticidad}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Matrícula {s.tail}</div>
                          <div className="text-xs text-muted-foreground">
                            Fecha{' '}
                            {new Date(s.dueDate).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {s.dueHours != null && <div>En {s.dueHours} h</div>}
                          {s.dueCycles != null && <div>En {s.dueCycles} ciclos</div>}
                        </div>
                      </li>
                    ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm">
          Exportar CSV
        </Button>
        <Button size="sm">Exportar PDF</Button>
      </div>
    </div>
  );
}
