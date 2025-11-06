'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Plane, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetWarehouseDashboard } from '@/hooks/sistema/dashboard/useWarehouseDashboard';

interface WarehouseDashboardProps {
  companySlug: string;
  location_id: string;
}

export default function WarehouseDashboard({ companySlug, location_id }: WarehouseDashboardProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useGetWarehouseDashboard(companySlug, location_id);

  return (
    <ContentLayout title={`Dashboard / ${companySlug || ''}`}>
      <header className="shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">  <Plane className="h-6 w-6 text-white" /> </div>
            <div>
              <h1 className="text-xl font-bold">Sistema de Gestión Aeronáutica Civil</h1>
              <p className="text-sm">Plataforma oficial de administración</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Sistema Seguro</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mt-4 mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Bienvenido a <span className="text-blue-600 block italic">SIGEAC</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            Plataforma integral para la gestión y control de operaciones aeronáuticas. 
            Acceda a herramientas especializadas para administrar el inventario, 
            supervisar operaciones y garantizar el cumplimiento normativo.
          </p>
        </div>

        {/* Call to Action Cards */}
        <div className="flex justify-center mb-12">
          <Card className="hover:shadow-lg transition-all duration-300 border-blue-200">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3 justify-center">
                <div className="bg-blue-100 p-2 rounded-lg"> <BarChart3 className="h-6 w-6 text-blue-600" /> </div>
                <CardTitle className="text-xl">Consulta de Inventario</CardTitle>
              </div>
              <CardDescription className="text-base pt-2"> Acceda al sistema completo de gestión de inventario aeronáutico </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => router.push(`/${companySlug}/almacen/inventario`)} >
                Ver Inventario Completo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl shadow-sm border p-8 min-h-[200px] flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-6 text-center">Sistema en Operación</h2>

          {isLoading && ( <div className="text-center text-blue-600"> Cargando datos del sistema...  </div> )}
          {isError && ( <div className="text-center text-red-500"> Error al cargar la información del dashboard. </div> )}

          {!isLoading && !isError && data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div> <div className="text-3xl font-bold text-blue-600"> {data.dispatchAircraftCount ?? '—'} </div> <div>Aeronaves Registradas</div> </div>
              <div> <div className="text-3xl font-bold text-green-600"> {data.storedCount ?? '—'} % </div> <div>Artículos Activos</div> </div>
              <div> <div className="text-3xl font-bold text-purple-600"> {data.dispatchCount ?? '—'} </div> <div>Despachos Realizados</div> </div>
              <div> <div className="text-3xl font-bold text-orange-600"> {data.tool_need_calibration_count ?? '—'} </div> <div>Herramientas por Calibrar </div> </div>
            </div>
          )}
        </div>
      </main>
    </ContentLayout>
  );
}