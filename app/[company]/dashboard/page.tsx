'use client';

import dynamic from 'next/dynamic';
import LoadingPage from '@/components/misc/LoadingPage';
import { useGetRoles } from '@/hooks/sistema/usuario/useGetRoles';
import { useCompanyStore } from '@/stores/CompanyStore';

// Importación dinámica del dashboard
const WarehouseDashboard = dynamic(() => import('@/components/dashboard/WarehouseDashboard'));

export default function DashboardPage() {
  const { selectedCompany } = useCompanyStore();
  const { data: roles, isLoading } = useGetRoles();

  if (isLoading) return <LoadingPage />;

  if (!roles || roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <h2 className="text-xl font-semibold text-gray-700">No se encontraron roles</h2>
        <p className="text-gray-500 mt-2">No tienes roles asignados o hubo un problema al obtenerlos.</p>
      </div>
    );
  }

  const roleNames = roles.map(r => r.name);
  const hasRole = (names: string[]) => names.some(r => roleNames.includes(r));

  // Renderizado condicional por rol
  if (hasRole(['JEFE_ALMACEN', 'ANALISTA_ALMACEN'])) {
    return (
      <WarehouseDashboard
        companySlug={selectedCompany?.slug || ''}
        inventoryUrl={`/${selectedCompany?.slug}/general/inventario`}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <h2 className="text-xl font-semibold text-gray-700">Dashboard no disponible</h2>
      <p className="text-gray-500 mt-2">Tu rol actual no tiene un panel asignado en el sistema.</p>
    </div>
  );
}
