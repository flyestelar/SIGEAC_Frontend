'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from '@/hooks/helpers/useDebounce';
import { useInventory } from '@/hooks/mantenimiento/almacen/renglones/useGetInventory';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import SearchSection from '../../general/inventario/_components/SearchSection';
import { columns } from './columns';
import { DataTable } from './data-table';

const InventarioPage = () => {
  const { selectedCompany, selectedStation } = useCompanyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    displayedBatches,
    isLoading,
    isBatchesError,
    batchesError,
    showNoResults,
  } = useInventory(selectedStation, selectedCompany?.slug, debouncedSearchTerm);

  // 🔹 Helpers para filtrar según categoría
  const filterByCategory = (category: string) =>
    displayedBatches.filter(b => b.status === category);

  return (
    <ContentLayout title='Gestión de Inventario'>
      <div className='flex flex-col gap-y-2'>
        {/* 🔹 Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${selectedCompany?.slug}/dashboard`}>Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Almacén</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>
                    <BreadcrumbLink href={`/${selectedCompany?.slug}/almacen/inventario/gestion`}>Gestión</BreadcrumbLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BreadcrumbLink href={`/${selectedCompany?.slug}/almacen/inventario/entregado`}>Entregados</BreadcrumbLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Gestión</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 🔹 Header */}
        <h1 className='text-4xl font-bold text-center'>Inventario de Almacén</h1>
        <p className='text-sm text-muted-foreground text-center italic'>
          Aquí puede observar todos los lotes de los diferentes almacenes. <br />
          Filtre y/o busque si desea un renglón en específico.
        </p>

        {/* 🔹 Buscador (opcional) */}
        <SearchSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          debouncedSearchTerm={debouncedSearchTerm}
          showNoResults={showNoResults}
        />

        {/* 🔹 Loading */}
        {isLoading && (
          <div className='flex w-full h-full justify-center items-center min-h-[300px]'>
            <Loader2 className='size-24 animate-spin' />
          </div>
        )}

        {/* 🔹 Tabs con DataTable */}
        {!isLoading && displayedBatches.length > 0 && (
          <Tabs defaultValue="serviciable">
            <TabsList>
              <TabsTrigger value="serviciable">Serviciables</TabsTrigger>
              <TabsTrigger value="removed">Removidos</TabsTrigger>
              <TabsTrigger value="consumable">Consumibles</TabsTrigger>
            </TabsList>

            <TabsContent value="serviciable">
              <DataTable columns={columns} data={filterByCategory('serviciable')} />
            </TabsContent>
            <TabsContent value="removed">
              <DataTable columns={columns} data={filterByCategory('removed')} />
            </TabsContent>
            <TabsContent value="consumable">
              <DataTable columns={columns} data={filterByCategory('consumable')} />
            </TabsContent>
          </Tabs>
        )}

        {/* 🔹 Errores */}
        {isBatchesError && (
          <span>Ha ocurrido un error al cargar los renglones...</span>
        )}

        {/* 🔹 Estado vacío */}
        {!isLoading && displayedBatches.length === 0 && !showNoResults && (
          <p className="text-center text-muted-foreground italic mt-6">
            No hay lotes registrados en este almacén todavía.
          </p>
        )}
      </div>
    </ContentLayout>
  );
};

export default InventarioPage;
