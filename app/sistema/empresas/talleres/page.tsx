'use client'

import { ContentLayout } from '@/components/layout/ContentLayout';
import { useGetWorkshops } from '@/hooks/sistema/empresas/talleres/useGetWorkshops';
import { Loader2 } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';

const WorkshopsPage = () => {
  const { data: workshops, isLoading, error } = useGetWorkshops();
  return (
    <ContentLayout title={'Almacenes'}>
      <h1 className='text-4xl font-bold text-center mb-2'>Control de Talleres</h1>
      <p className='text-sm text-muted-foreground text-center'>
        Aquí puede observar todos los talleres registrados. Filtre y/o busque sí desea un taller en específico. <br /> Presione el boton de <strong>Crear</strong> en caso de querer crear un nuevo taller.
      </p>
      {
        isLoading && (
          <div className='grid mt-72 place-content-center'>
            <Loader2 className='w-12 h-12 animate-spin' />
          </div>
        )
      }
      {
        error && (
          <div className='grid mt-72 place-content-center'>
            <p className='text-sm text-muted-foreground'>Ha ocurrido un error al cargar los talleres...</p>
          </div>
        )
      }
      {
        workshops && (
          <DataTable columns={columns} data={workshops} />
        )
      }
    </ContentLayout>
  )
}

export default WorkshopsPage
