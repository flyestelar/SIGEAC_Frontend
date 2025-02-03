'use client'

import { ContentLayout } from '@/components/layout/ContentLayout'
import { useGetVendors } from '@/hooks/ajustes/globales/proveedores/useGetVendors'
import { Loader2 } from 'lucide-react'
import { columns } from './columns'
import { DataTable } from './data-table'

const VendorsPage = () => {
  const { data: vendors, isLoading, error } = useGetVendors();
  return (
    <ContentLayout title='Permisos'>
      <h1 className='text-5xl font-bold text-center mt-2'>
        Control de Proveedores
      </h1>
      <p className='text-sm text-muted-foreground text-center italic mt-2'>Aquí puede llevar el control de los proveedores registrados para las diferentes compras.</p>
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
            <p className='text-sm text-muted-foreground'>Ha ocurrido un error al cargar las empresas...</p>
          </div>
        )
      }
      {
        vendors && (
          <DataTable columns={columns} data={vendors} />
        )
      }
    </ContentLayout>
  )
}

export default VendorsPage
