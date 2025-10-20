'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Clock, PackageSearch } from 'lucide-react';

// --- Datos mock ---
const hoy = new Date('2025-10-18');

// Movimientos diarios (últimos 30 días)
const movimientosData = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date(hoy);
  d.setDate(hoy.getDate() - (29 - i));
  const entradas = Math.floor(50 + Math.random() * 120);
  const salidas = Math.floor(30 + Math.random() * 110);
  return {
    date: d.toISOString().slice(0, 10),
    entradas,
    salidas,
  };
});

// Stock por categoría
const categoriasData = [
  { categoria: 'Herramientas', stock: 320, minimo: 250 },
  { categoria: 'Consumibles', stock: 540, minimo: 400 },
  { categoria: 'Componentes', stock: 190, minimo: 220 },
  { categoria: 'Lubricantes', stock: 85, minimo: 120 },
  { categoria: 'EPIs', stock: 410, minimo: 300 },
];

// Servicios/calibraciones próximos (<= 14 días)
const serviciosProximos = [
  {
    id: 'SV-1021',
    articulo: 'Torquímetro 3/8\"',
    tipo: 'Calibración',
    fecha: '2025-10-22',
    dias: 4,
    criticidad: 'alta',
  },
  {
    id: 'SV-1043',
    articulo: 'Balanza de precisión',
    tipo: 'Calibración',
    fecha: '2025-10-28',
    dias: 10,
    criticidad: 'media',
  },
  {
    id: 'SV-1062',
    articulo: 'Compresor línea B',
    tipo: 'Mantenimiento',
    fecha: '2025-10-19',
    dias: 1,
    criticidad: 'alta',
  },
  { id: 'SV-1069', articulo: 'Manómetro #12', tipo: 'Verificación', fecha: '2025-10-31', dias: 13, criticidad: 'baja' },
];

// Próximos vencimientos de lotes
const vencimientosData = [
  { lote: 'L-342A', item: 'Aceite MIL-PRF-83282', vence: '2025-11-05', dias: 18 },
  { lote: 'L-991C', item: 'Sellador aeronáutico', vence: '2025-11-02', dias: 15 },
  { lote: 'L-221B', item: 'Desengrasante', vence: '2025-12-01', dias: 44 },
];

// Top artículos con bajo stock
const bajoStock = [
  { part: '34200405-1', desc: 'Filtro hidráulico', stock: 6, minimo: 12 },
  { part: 'AERO-9921', desc: 'Guantes dieléctricos', stock: 14, minimo: 30 },
  { part: 'PK-AVR-77', desc: 'Kit de juntas', stock: 2, minimo: 10 },
];

// Actividad reciente
const actividad = [
  {
    id: 'DO-12011',
    tipo: 'Despacho',
    quien: 'H. Campos',
    detalle: '3× Tornillo AN3-7A → Taller Motor',
    fecha: '2025-10-18 09:12',
  },
  {
    id: 'IN-5542',
    tipo: 'Entrada',
    quien: 'K. Rojas',
    detalle: 'Lote L-342A Aceite 20× 1L',
    fecha: '2025-10-17 17:21',
  },
  {
    id: 'ADJ-909',
    tipo: 'Ajuste',
    quien: 'A. Anton',
    detalle: 'Corrección inventario Zona C',
    fecha: '2025-10-17 11:02',
  },
];

// KPIs
const totalEntradas = movimientosData.reduce((a, c) => a + c.entradas, 0);
const totalSalidas = movimientosData.reduce((a, c) => a + c.salidas, 0);
const variacion = ((totalEntradas - totalSalidas) / Math.max(totalSalidas, 1)) * 100;
const serviciosCriticos = serviciosProximos.filter((s) => s.criticidad === 'alta').length;
const itemsBajoMinimo = bajoStock.length + categoriasData.filter((c) => c.stock < c.minimo).length;

// --- Config de charts ---
const chartConfigMov: ChartConfig = {
  entradas: { label: 'Entradas', color: 'hsl(var(--chart-2))' },
  salidas: { label: 'Salidas', color: 'hsl(var(--chart-1))' },
};

const chartConfigCat: ChartConfig = {
  stock: { label: 'Stock', color: 'hsl(var(--chart-3))' },
  minimo: { label: 'Mínimo', color: 'hsl(var(--chart-4))' },
};

function KPI({
  title,
  value,
  hint,
  trend,
}: {
  title: string;
  value: React.ReactNode;
  hint?: string;
  trend?: 'up' | 'down' | 'flat';
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0 text-sm text-muted-foreground flex items-center gap-2">
          {trend === 'up' && <ArrowUpRight className="h-4 w-4" />}
          {trend === 'down' && <ArrowDownRight className="h-4 w-4" />}
          <span>{hint}</span>
        </CardContent>
      ) : null}
    </Card>
  );
}

export default function TestChart() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Almacén · Resumen</h1>
          <p className="text-sm text-muted-foreground">Mock de prueba para tablero de inventario</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Exportar
          </Button>
          <Button size="sm">Nueva entrada</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI
          title="Entradas 30d"
          value={totalEntradas.toLocaleString()}
          hint="vs salidas en el período"
          trend={variacion >= 0 ? 'up' : 'down'}
        />
        <KPI
          title="Salidas 30d"
          value={totalSalidas.toLocaleString()}
          hint={`${Math.abs(variacion).toFixed(1)}% ${variacion >= 0 ? 'más entradas' : 'más salidas'}`}
          trend={variacion >= 0 ? 'up' : 'down'}
        />
        <KPI
          title="Servicios críticos"
          value={
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {servicesBadge(serviciosCriticos)}
            </div>
          }
          hint={
            serviciosProximos
              .filter((s) => s.criticidad === 'alta')
              .map((s) => s.id)
              .join(', ') || 'Sin críticos'
          }
          trend={serviciosCriticos > 0 ? 'down' : 'flat'}
        />
        <KPI
          title="Bajo mínimo"
          value={
            <div className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5" />
              {itemsBajoMinimo}
            </div>
          }
          hint="Artículos y categorías por debajo del mínimo"
          trend={itemsBajoMinimo > 0 ? 'down' : 'flat'}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle>Movimientos diarios</CardTitle>
            <CardDescription>Entradas vs salidas (últimos 30 días)</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={chartConfigMov} className="h-[280px] w-full">
              <BarChart data={movimientosData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                />
                <YAxis width={36} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent className="w-[200px]" />} />
                <Bar dataKey="entradas" stackId="a" fill="var(--color-entradas)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="salidas" stackId="a" fill="var(--color-salidas)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Stock por categoría</CardTitle>
            <CardDescription>Comparativo vs mínimo</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={chartConfigCat} className="h-[280px] w-full">
              <BarChart data={categoriasData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="categoria" type="category" tickLine={false} axisLine={false} width={110} />
                <XAxis type="number" hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="stock" fill="var(--color-stock)" radius={[0, 8, 8, 0]} />
                <Bar dataKey="minimo" fill="var(--color-minimo)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Paneles secundarios */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle>Servicios próximos</CardTitle>
            <CardDescription>Calibraciones y mantenimientos en los próximos 14 días</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {serviciosProximos
                .sort((a, b) => a.dias - b.dias)
                .map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      'border rounded-2xl p-3 flex items-center justify-between',
                      s.criticidad === 'alta' && 'bg-destructive/5',
                      s.criticidad === 'media' && 'bg-warning/5',
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {s.criticidad === 'alta' ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                        <span className="font-medium">{s.tipo}</span>
                        <Badge
                          variant={
                            s.criticidad === 'alta' ? 'destructive' : s.criticidad === 'media' ? 'secondary' : 'outline'
                          }
                        >
                          {s.criticidad}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{s.articulo}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(s.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold leading-none">{s.dias}</div>
                      <div className="text-xs text-muted-foreground">días</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Vencimientos de lotes</CardTitle>
            <CardDescription>Próximos 60 días</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ScrollArea className="h-[280px] pr-2">
              <ul className="space-y-3">
                {vencimientosData.map((v) => (
                  <li key={v.lote} className="border rounded-2xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{v.item}</div>
                      <Badge variant={v.dias <= 15 ? 'destructive' : 'secondary'}>{v.dias} días</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Lote {v.lote} · Vence{' '}
                      {new Date(v.vence).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function servicesBadge(n: number) {
  if (n === 0) return <Badge variant="outline">0</Badge>;
  if (n <= 2) return <Badge variant="secondary">{n}</Badge>;
  return <Badge variant="destructive">{n}</Badge>;
}
