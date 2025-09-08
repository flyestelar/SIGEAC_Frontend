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
import { useGetConditions } from '@/hooks/administracion/useGetConditions';
import { useGetBatchesByArticleCondition } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesByArticleCondition';

const WarehouseInventoryPage = () => {
  const { selectedStation, selectedCompany } = useCompanyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<"all" | "COMPONENTE" | "CONSUMIBLE" | "HERRAMIENTA">("all");
  const [componentCondition, setComponentCondition] = useState<"all" | "SERVICIABLE" | "REMOVIDO" | "NO_SERVICIABLE" | "CUSTODIA">("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const isComponentTab = activeCategory === "COMPONENTE";
  const hasQuery = debouncedSearchTerm.trim().length > 0;
  const hasSpecificCondition = isComponentTab && componentCondition !== "all";
  const {data: conditions, isLoading: isConditionsLoading, isError: isConditionsError} = useGetConditions()
  const {data: conditionedBatches, isLoading: isLoadingCondition, isError: isConditionError, error: conditionError} = useGetBatchesByArticleCondition(hasSpecificCondition ? conditions?.find((c) => c.name === componentCondition)?.id.toString() : undefined)

  const {
    data: allBatches = [],
    isLoading: isLoadingBatches,
    isError: isBatchesError,
    error: batchesError
  } = useGetBatches();

  const {
    data: searchedBatches,
    isLoading: isLoadingSearch,
    isError: isSearchError,
    error: searchError
  } = useSearchBatchesByPartNumber(
    selectedCompany?.slug,
    selectedStation ?? undefined,
    hasQuery ? debouncedSearchTerm : undefined
  );

  useEffect(() => {
    if (activeCategory !== "COMPONENTE") setComponentCondition("all");
  }, [activeCategory]);

  const searchedIdSet = useMemo(() => {
    if (!hasQuery || !searchedBatches) return null;
    return new Set(searchedBatches.map(b => b.id));
  }, [hasQuery, searchedBatches]);

    const displayedBatches = useMemo(() => {
      // 1) Base según pestaña/condición:
      // - Si estás en COMPONENTE con condición específica -> usa lo que venga del endpoint
      // - Si estás en COMPONENTE con "all" -> filtra los allBatches por categoría COMPONENTE
      // - Si estás en otras categorías -> filtra por esa categoría desde allBatches
      let base =
        hasSpecificCondition
          ? (conditionedBatches ?? [])
          : (allBatches ?? []);

      if (!hasSpecificCondition) {
        if (activeCategory !== "all") {
          base = base.filter(b => b.category === activeCategory);
        }
      } else {
        // Opcional: si quieres blindarte por si el endpoint devuelve algo fuera de COMPONENTE
        base = base.filter(b => b.category === "COMPONENTE");
      }

      // 2) Intersección con búsqueda (si hay query)
      if (hasQuery) {
        if (!searchedBatches) {
          // Aún cargando la búsqueda: conserva base (no parpadea la UI)
          return base;
        }
        if (searchedBatches.length === 0) return [];
        base = base.filter(b => searchedIdSet?.has(b.id));
      }

      return base;
    }, [
      allBatches,
      conditionedBatches,
      activeCategory,
      hasSpecificCondition,
      hasQuery,
      searchedBatches,
      searchedIdSet
    ]);

  const isLoading = isLoadingBatches || (hasQuery && isLoadingSearch);
  const isEmpty = !isLoading && displayedBatches.length === 0;

  return (
    <ContentLayout title='Inventario'>
      <div className='flex flex-col gap-y-2'>
        {/* Breadcrumb + encabezado */}
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
          Aquí puede observar todos los renglones de los diferentes almacenes.
          <br />Filtre y/o busque si desea un renglón en específico.
        </p>

        {/* Buscador */}
        <SearchSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          debouncedSearchTerm={debouncedSearchTerm}
          showNoResults={hasQuery && isEmpty}
        />

        {isLoading ? (
          <div className='flex w-full h-full justify-center items-center min-h-[300px]'>
            <Loader2 className='size-24 animate-spin' />
          </div>
        ) : (
          <>
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as typeof activeCategory)}>
              <TabsList className="flex justify-center mb-4 space-x-3" aria-label="Categorías">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger className='flex gap-2' value="COMPONENTE"><Package2 className='size-5' /> Componente</TabsTrigger>
                <TabsTrigger className='flex gap-2' value="CONSUMIBLE"><PaintBucket className='size-5' /> Consumibles</TabsTrigger>
                <TabsTrigger className='flex gap-2' value="HERRAMIENTA"><Wrench className='size-5' /> Herramientas</TabsTrigger>
              </TabsList>

              <TabsContent value={activeCategory}>
                {activeCategory === "COMPONENTE" && (
                  <Tabs
                    value={componentCondition}
                    onValueChange={(v) => setComponentCondition(v as typeof componentCondition)}
                    className="mb-4"
                  >
                    <TabsList className="flex justify-center mb-4 space-x-3" aria-label="Condición de componente">
                      <TabsTrigger value="all">Todos</TabsTrigger>
                      <TabsTrigger value="SERVICIABLE">Serviciables</TabsTrigger>
                      <TabsTrigger value="REMOVIDO">Removidos</TabsTrigger>
                      <TabsTrigger value="NO_SERVICIABLE">No Serviciables</TabsTrigger>
                      <TabsTrigger value="CUSTODIA">En custodia</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}

                {isEmpty ? (
                  <div className="text-center text-sm text-muted-foreground italic py-10">
                    <DataTable
                      columns={columns}
                      initialData={[]}
                    />
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    initialData={displayedBatches}
                    isSearching={hasQuery && isLoadingSearch}
                    searchTerm={hasQuery ? debouncedSearchTerm.trim() : ""}
                  />
                )}
              </TabsContent>
            </Tabs>

            {isBatchesError && (
              <div className="text-red-500 text-center text-sm italic">
                Error cargando batches: {String(batchesError)}
              </div>
            )}
            {isSearchError && (
              <div className="text-red-500 text-center text-sm italic">
                Error en búsqueda: {String(searchError)}
              </div>
            )}
          </>
        )}
      </div>
    </ContentLayout>
  );
};


export default WarehouseInventoryPage;
