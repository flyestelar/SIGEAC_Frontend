'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import { useGetDispatchedArticles } from '@/hooks/almacen/useGetDispatchedArticles';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
const InventarioPage = () => {

  const { selectedStation } = useCompanyStore();

  const { data: articles, isLoading: isArticlesLoading, isError } = useGetDispatchedArticles(selectedStation ?? undefined);

  return (
    <ContentLayout title='Inventario'>
      <div className='flex flex-col gap-y-2'>
        <h1 className='text-5xl font-bold text-center'>Articulos Despachados</h1>
        <p className='text-sm text-muted-foreground text-center italic mb-0'>
          Aquí puede observar todos los articulos que se encuentran fuera de almacén. <br />Filtre y/o busque sí desea un articulo en específico.
        </p>
        {
          isArticlesLoading && (
            <div className='flex w-full h-full justify-center items-center'>
              <Loader2 className='size-24 animate-spin mt-48' />
            </div>
          )
        }
        {
          articles && (
            <DataTable columns={columns} data={articles} />

          )
        }
        {
          isError && <p className='text-sm text-muted-foreground'>Ha ocurrido un error al cargar los articulos...</p>
        }
      </div>
    </ContentLayout>
  )
}

export default InventarioPage
