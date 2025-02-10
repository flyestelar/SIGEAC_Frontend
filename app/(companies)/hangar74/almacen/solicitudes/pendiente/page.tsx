'use client'

import { ContentLayout } from '@/components/layout/ContentLayout'
import { useGetPendingDispatches } from '@/hooks/almacen/useGetPendingDispatchRequests'
import { useCompanyStore } from '@/stores/CompanyStore'
import { Loader2 } from 'lucide-react'
import { columns } from './columns'
import { DataTable } from './data-table'
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
const DispatchRequestPage = () => {
  const { selectedStation } = useCompanyStore();
  const { data: dispatches, isPending: isDispatchesLoading, isError } = useGetPendingDispatches(selectedStation ?? undefined)
  return (
    <ContentLayout title='Salida'>
      <div className='flex flex-col gap-y-2'>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/hangar74/dashboard">Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Almacen</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>
                    <BreadcrumbLink href="/hangar74/almacen/solicitudes/pendiente">Pendientes</BreadcrumbLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BreadcrumbLink href="/hangar74/almacen/solicitudes/salida">Salida</BreadcrumbLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Pendiente</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {
          isDispatchesLoading && (
            <div className='flex w-full h-full justify-center items-center'>
              <Loader2 className='size-24 animate-spin mt-48' />
            </div>
          )
        }
        {
          dispatches && (
            <DataTable columns={columns} data={dispatches} />

          )
        }
        {
          isError && <p className='text-sm text-muted-foreground'>Ha ocurrido un error al cargar las solicitudes...</p>
        }
      </div>
    </ContentLayout>
  )
}

export default DispatchRequestPage
