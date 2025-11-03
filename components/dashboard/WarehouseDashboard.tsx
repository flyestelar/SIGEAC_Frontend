'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Plane, Shield } from 'lucide-react';

interface WarehouseDashboardProps {
  companySlug: string;
  inventoryUrl: string;
}

const WarehouseDashboard = ({ companySlug, inventoryUrl }: WarehouseDashboardProps) => {
  return (
    <ContentLayout title={`Dashboard / ${companySlug}`}>
      <header className="shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Plane className="h-6 w-6 text-white" />
            </div>
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

      <main className="max-w-7xl mt-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Bienvenido a<span className="text-blue-600 block italic">SIGEAC</span>
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed">
              Plataforma integral para la gestión y control de operaciones aeronáuticas. Acceda a herramientas
              especializadas para administrar el inventario, supervisar operaciones y garantizar el cumplimiento
              normativo.
            </p>
          </div>

          {/* Call to Action Cards */}
          <div className="flex justify-center mb-12">
            <Card className="hover:shadow-lg transition-all duration-300 border-blue-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 justify-center">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Consulta de Inventario</CardTitle>
                </div>
                <CardDescription className="text-base pt-2">
                  Acceda al sistema completo de gestión de inventario aeronáutico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = inventoryUrl} // Se puede reemplazar con router push si se pasa
                >
                  Ver Inventario Completo
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl shadow-sm border p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Sistema en Operación</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">+8</div>
                <div>Aeronaves Registradas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">+1,800</div>
                <div>Articulos Activos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">98.7%</div>
                <div>Disponibilidad</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">24/7</div>
                <div>Soporte Operacional</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ContentLayout>
  );
};

export default WarehouseDashboard;
