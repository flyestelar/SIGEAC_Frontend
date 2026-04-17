'use client';

import CompanySelect from '@/components/selects/CompanySelect';
import { useCompanyStore } from '@/stores/CompanyStore';
import { PlaneTakeoff } from 'lucide-react';

export default function RequireCompany({ children }: { children: React.ReactNode }) {
  const { selectedCompany, selectedStation } = useCompanyStore();

  // If company and station are selected, render children (mount children)
  if (selectedCompany && selectedStation) return children;

  // Otherwise unmount children and show selector UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex justify-center items-center max-w-sm mx-auto p-6 bg-card rounded-lg shadow">
        <div className="flex flex-col items-center justify-center gap-4">
          <PlaneTakeoff className="size-32" />
          <h2 className="text-2xl font-bold text-center">Seleccione Empresa y Estación</h2>
          <p className="text-muted-foreground text-center">
            Por favor, seleccione una <strong>empresa</strong> y una <strong>estación</strong> para comenzar.
          </p>
          <CompanySelect />
        </div>
      </div>
    </div>
  );
}
