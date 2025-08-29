"use client";

import { ContentLayout } from '@/components/layout/ContentLayout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from '@/hooks/helpers/useDebounce';
import { useGetBatches } from '@/hooks/mantenimiento/almacen/renglones/useGetBatches';
import { useSearchBatchesByPartNumber } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesByArticlePartNumber';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Loader2, Package2, PaintBucket, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import SearchSection from '../../../../components/misc/SearchSection';
import { columns } from './columns';
import { DataTable } from './data-table';

const InventarioPage = () => {
  const { selectedStation, selectedCompany } = useCompanyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // loading de transición de 500ms cuando cambia el término de búsqueda
  const [transitionLoading, setTransitionLoading] = useState(false);
  useEffect(() => {
    setTransitionLoading(true);
    const timeout = setTimeout(() => setTransitionLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [debouncedSearchTerm]);

  // Estado de categoría activa
  const [activeCategory, setActiveCategory] = useState("all");

  // Consultas a la API
  const { data: allBatches, isLoading: isLoadingBatches, isError: isBatchesError, error: batchesError } = useGetBatches();
  const { data: searchedBatches, isLoading: isLoadingSearch, isError: isSearchError, error: searchError } =
    useSearchBatchesByPartNumber(selectedCompany?.slug, selectedStation ?? undefined, debouncedSearchTerm || undefined);

  // Memoización de batches filtrados
  const displayedBatches = useMemo(() => {
    if (!allBatches) return [];

    let baseData = allBatches;

    // Si hay búsqueda -> filtrar por resultados de búsqueda
    if (debouncedSearchTerm && searchedBatches) {
      const searchedIds = new Set(searchedBatches.map(b => b.id));
      baseData = baseData.filter(b => searchedIds.has(b.id));
    } else if (debouncedSearchTerm && searchedBatches?.length === 0) {
      return [];
    }

    // Filtrar por categoría (asumiendo que cada batch tiene un campo category)
    if (activeCategory !== "all") {
      baseData = baseData.filter(b => b.category === activeCategory);
    }

    return baseData;
  }, [allBatches, searchedBatches, debouncedSearchTerm, activeCategory]);

  const isLoading = isLoadingBatches || !!(debouncedSearchTerm && isLoadingSearch);
  const isEmptyState = !isLoading && displayedBatches?.length === 0;
  const showNoResults = !isLoading && !!debouncedSearchTerm && isEmptyState;

  return (
    <ContentLayout title='Inventario'>
      <div className='flex flex-col gap-y-2'>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${selectedCompany?.slug}/dashboard`}>Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Inventario General</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className='text-4xl font-bold text-center'>Inventario General</h1>
        <p className='text-sm text-muted-foreground text-center italic'>
          Aquí puede observar all los renglones de los diferentes almacenes. <br />Filtre y/o busque si desea un renglón en específico.
        </p>

        {/* Buscador */}
        <SearchSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          debouncedSearchTerm={debouncedSearchTerm}
          showNoResults={showNoResults}
        />

        {isLoading ? (
          <div className='flex w-full h-full justify-center items-center min-h-[300px]'>
            <Loader2 className='size-24 animate-spin' />
          </div>
        ) : (
          <>
            {allBatches && (
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="flex justify-center mb-4 space-x-3">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger className='flex gap-2' value="COMPONENTE"><Package2 className='size-5' /> Componente</TabsTrigger>
                  <TabsTrigger className='flex gap-2' value="CONSUMIBLE"><PaintBucket className='size-5' />Consumibles</TabsTrigger>
                  <TabsTrigger className='flex gap-2' value="HERRAMIENTA"><Wrench className='size-5' /> Herramientas</TabsTrigger>
                </TabsList>

                <TabsContent value={activeCategory}>
                  <DataTable
                    columns={columns}
                    initialData={displayedBatches}
                    isSearching={!!debouncedSearchTerm && debouncedSearchTerm.trim() !== ""}
                    searchTerm={debouncedSearchTerm?.trim() || ""}
                  />
                </TabsContent>
              </Tabs>
            )}

            {isBatchesError && (
              <div className="text-red-500 text-center text-sm italic">
                Error cargando batches: {batchesError.message}
              </div>
            )}
            {isSearchError && (
              <div className="text-red-500 text-center text-sm italic">
                Error en búsqueda: {searchError.message}
              </div>
            )}
          </>
        )}
      </div>
    </ContentLayout>
  );
};

export default InventarioPage;
