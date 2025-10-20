'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';

// ------------------ Mock data ------------------
const today = new Date('2025-10-18');

// Despachos por destino (últimos 12 semanas)
const despachosSemanas = Array.from({ length: 12 }).map((_, i) => {
  const start = new Date(today);
  start.setDate(today.getDate() - (11 - i) * 7);
  return {
    week: format(start, 'MM/dd'),
    Taller: Math.floor(40 + Math.random() * 60),
    Aeronave: Math.floor(25 + Math.random() * 45),
    Otros: Math.floor(5 + Math.random() * 20),
  };
});

// Entradas por proveedor (Top 8)
const entradasProveedor = [
  { proveedor: 'AeroParts LLC', entradas: 128 },
  { proveedor: 'LubriTech', entradas: 96 },
  { proveedor: 'Seal&Co', entradas: 84 },
  { proveedor: 'FastenersPro', entradas: 78 },
  { proveedor: 'AirEquip', entradas: 66 },
  { proveedor: 'CleanJet', entradas: 54 },
  { proveedor: 'MecaTools', entradas: 52 },
  { proveedor: 'SkyChem', entradas: 41 },
];

// Consumo por categoría (últimos 30 días)
const consumoCategoria = [
  { categoria: 'Herramientas', consumo: 210 },
  { categoria: 'Consumibles', consumo: 480 },
  { categoria: 'Componentes', consumo: 160 },
  { categoria: 'Lubricantes', consumo: 120 },
  { categoria: 'EPIs', consumo: 190 },
];

// Rotación y DIO (days inventory outstanding) por categoría
const rotacion = [
  { categoria: 'Herramientas', rotacion: 3.2, dio: 114 },
  { categoria: 'Consumibles', rotacion: 7.1, dio: 51 },
  { categoria: 'Componentes', rotacion: 2.4, dio: 152 },
  { categoria: 'Lubricantes', rotacion: 4.6, dio: 79 },
  { categoria: 'EPIs', rotacion: 5.0, dio: 73 },
];

// Fill rate y OTIF por mes (YTD)
const otif = Array.from({ length: 10 }).map((_, i) => {
  const d = new Date(today.getFullYear(), i, 1);
  return {
    mes: format(d, 'MMM'),
    fillRate: Math.round(90 + Math.random() * 8),
    otif: Math.round(88 + Math.random() * 10),
  };
});

// Aging de stock por tramos
const aging = [
  { tramo: '0-30', valor: 24_500 },
  { tramo: '31-60', valor: 17_300 },
  { tramo: '61-90', valor: 11_900 },
  { tramo: '91-180', valor: 9_400 },
  { tramo: '181+', valor: 6_200 },
];

// Backorders abiertos por prioridad
const backorders = [
  { prioridad: 'Alta', pedidos: 14 },
  { prioridad: 'Media', pedidos: 27 },
  { prioridad: 'Baja', pedidos: 19 },
];

// Valorización de inventario por categoría
const valorizacion = [
  { categoria: 'Herramientas', valor: 62_300 },
  { categoria: 'Consumibles', valor: 88_700 },
  { categoria: 'Componentes', valor: 133_900 },
  { categoria: 'Lubricantes', valor: 24_600 },
  { categoria: 'EPIs', valor: 29_800 },
];

// ------------------ Chart configs ------------------
const cfgDespachos: ChartConfig = {
  Taller: { label: 'Taller', color: 'hsl(var(--chart-1))' },
  Aeronave: { label: 'Aeronave', color: 'hsl(var(--chart-2))' },
  Otros: { label: 'Otros', color: 'hsl(var(--chart-3))' },
};

const cfgEntradas: ChartConfig = {
  entradas: { label: 'Entradas', color: 'hsl(var(--chart-4))' },
};

const cfgConsumo: ChartConfig = {
  consumo: { label: 'Consumo', color: 'hsl(var(--chart-2))' },
};

const cfgRotacion: ChartConfig = {
  rotacion: { label: 'Rotación (veces/año)', color: 'hsl(var(--chart-1))' },
  dio: { label: 'DIO (días)', color: 'hsl(var(--chart-3))' },
};

const cfgOTIF: ChartConfig = {
  fillRate: { label: 'Fill rate %', color: 'hsl(var(--chart-2))' },
  otif: { label: 'OTIF %', color: 'hsl(var(--chart-1))' },
};

const cfgAging: ChartConfig = {
  valor: { label: 'Valor', color: 'hsl(var(--chart-5))' },
};

const cfgBackorders: ChartConfig = {
  pedidos: { label: 'Pedidos', color: 'hsl(var(--chart-1))' },
};

const cfgVal: ChartConfig = {
  valor: { label: 'Valor', color: 'hsl(var(--chart-4))' },
};

// Simple rango de fechas mock
function useDateRangeMock() {
  const [range] = React.useState<DateRange>({ from: addDays(today, -30), to: today });
  return range;
}

export default function ReportesAlmacenMock() {
  const range = useDateRangeMock();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reportes de Almacén</h1>
          <p className="text-sm text-muted-foreground">Vista solo-reportes con datos simulados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Exportar CSV
          </Button>
          <Button size="sm">Exportar PDF</Button>
        </div>
      </header>

      <div className="text-xs text-muted-foreground">
        Rango: {format(range.from!, 'dd/MM/yyyy')} – {format(range.to!, 'dd/MM/yyyy')}
      </div>

      <Tabs defaultValue="despachos" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <TabsTrigger value="despachos">Despachos por destino</TabsTrigger>
          <TabsTrigger value="entradas">Entradas por proveedor</TabsTrigger>
          <TabsTrigger value="consumo">Consumo por categoría</TabsTrigger>
          <TabsTrigger value="rotacion">Rotación y DIO</TabsTrigger>
          <TabsTrigger value="otif">Fill rate / OTIF</TabsTrigger>
          <TabsTrigger value="aging">Aging de stock</TabsTrigger>
        </TabsList>

        {/* Despachos por destino */}
        <TabsContent value="despachos">
          <Card>
            <CardHeader>
              <CardTitle>Despachos por destino</CardTitle>
              <CardDescription>Últimas 12 semanas</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={cfgDespachos} className="h-[320px] w-full">
                <BarChart data={despachosSemanas} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width={36} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="Taller" fill="var(--color-Taller)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Aeronave" fill="var(--color-Aeronave)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Otros" fill="var(--color-Otros)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entradas por proveedor */}
        <TabsContent value="entradas">
          <Card>
            <CardHeader>
              <CardTitle>Entradas por proveedor</CardTitle>
              <CardDescription>Top 8</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={cfgEntradas} className="h-[320px] w-full">
                <BarChart data={entradasProveedor} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="proveedor" type="category" width={140} tickLine={false} axisLine={false} />
                  <XAxis type="number" hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="entradas" fill="var(--color-entradas)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consumo por categoría */}
        <TabsContent value="consumo">
          <Card>
            <CardHeader>
              <CardTitle>Consumo por categoría</CardTitle>
              <CardDescription>Últimos 30 días</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={cfgConsumo} className="h-[320px] w-full">
                <BarChart data={consumoCategoria} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="categoria" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width={36} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="consumo" fill="var(--color-consumo)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rotación y DIO */}
        <TabsContent value="rotacion">
          <Card>
            <CardHeader>
              <CardTitle>Rotación y DIO por categoría</CardTitle>
              <CardDescription>Indicadores de salud de inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={cfgRotacion} className="h-[320px] w-full">
                <LineChart data={rotacion} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width={40} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="rotacion" stroke="var(--color-rotacion)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="dio" stroke="var(--color-dio)" dot={false} strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OTIF */}
        <TabsContent value="otif">
          <Card>
            <CardHeader>
              <CardTitle>Fill rate y OTIF</CardTitle>
              <CardDescription>Desempeño por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={cfgOTIF} className="h-[320px] w-full">
                <LineChart data={otif} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width={36} domain={[80, 100]} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="fillRate" stroke="var(--color-fillRate)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="otif" stroke="var(--color-otif)" dot={false} strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aging de stock */}
        <TabsContent value="aging">
          <Card>
            <CardHeader>
              <CardTitle>Aging de stock</CardTitle>
              <CardDescription>Valor inmovilizado por tramo de antigüedad</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={cfgAging} className="h-[320px] w-full">
                <BarChart data={aging} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="tramo" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    width={60}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="valor" fill="var(--color-valor)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Backorders por prioridad</CardTitle>
                <CardDescription>Pedidos pendientes</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ChartContainer config={cfgBackorders} className="h-[280px] w-full">
                  <PieChart>
                    <Pie data={backorders} dataKey="pedidos" nameKey="prioridad" innerRadius={60} outerRadius={100}>
                      {backorders.map((_, i) => (
                        <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valorización por categoría</CardTitle>
                <CardDescription>USD</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={cfgVal} className="h-[280px] w-full">
                  <BarChart data={valorizacion} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="categoria" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis
                      width={60}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="valor" fill="var(--color-valor)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
