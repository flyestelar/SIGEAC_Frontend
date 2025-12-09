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
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetDispatchesByLocation } from '@/hooks/mantenimiento/almacen/solicitudes/useGetDispatchesRequests';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { columns, DispatchArticleRow } from './columns';
import { DataTable } from './data-table';
import { MaintenanceAircraft, WorkOrder, Workshop } from '@/types';

export interface DispatchArticle {
  id: number;
  part_number: string;
  serial: string | null;
  description: string | null;
  category?: string | null;
  batch: string;
  dispatch_quantity: string | number;
}

interface IDispatch {
  id: number;
  request_number: string;
  requested_by: string;
  created_by: string;
  justification: string;
  destination_place: string;
  submission_date: string;
  work_order?: WorkOrder;
  aircraft?: MaintenanceAircraft;
  workshop?: Workshop;
  status: 'PROCESO' | 'APROBADO' | 'RECHAZADO';
  articles: DispatchArticle[];
}

function mapDispatchesToRows(dispatches: IDispatch[]): DispatchArticleRow[] {
  return dispatches.flatMap((dispatch) =>
    dispatch.articles.map((article) => ({
      dispatchId: dispatch.id,
      request_number: dispatch.request_number,
      aircraftOrWorkshop: dispatch.aircraft
        ? dispatch.aircraft.acronym
        : dispatch.workshop
          ? dispatch.workshop.name
          : 'N/A',
      submission_date: dispatch.submission_date,
      part_number: article.part_number, // adapta estos campos
      description: article.batch,
      quantity: article.dispatch_quantity,
      serial: article.serial,
      requested_by: dispatch.requested_by,
      created_by: dispatch.created_by,
    })),
  );
}

const DispatchRequestPage = () => {
  const { selectedCompany } = useCompanyStore();

  const { data: dispatches, isLoading: isDispatchesLoading, isError } = useGetDispatchesByLocation();

  const [activeCategory, setActiveCategory] = useState('Todos');

  const filteredDispatches = useMemo(() => {
    if (!dispatches) return [];

    if (activeCategory === 'Todos') return dispatches;

    return dispatches.filter((d) => d.status === activeCategory);
  }, [dispatches, activeCategory]);

  const rows = mapDispatchesToRows(filteredDispatches);

  return (
    <ContentLayout title="Salida">
      <div className="flex flex-col gap-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${selectedCompany?.slug}/dashboard`}>Inicio</BreadcrumbLink>
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
                    <BreadcrumbLink href={`/${selectedCompany?.slug}/almacen/solicitudes/pendiente`}>
                      Pendientes
                    </BreadcrumbLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BreadcrumbLink href={`/${selectedCompany?.slug}/almacen/solicitudes/salida`}>
                      Salida
                    </BreadcrumbLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Salida</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-5xl font-bold text-center">Registro de Salidas</h1>
        <p className="text-sm italic text-muted-foreground text-center">
          Aquí puede ver el registro de movimientos de los articulos, así como también solicitar la salida de uno.
        </p>

        {isDispatchesLoading && (
          <div className="flex w-full h-full justify-center items-center">
            <Loader2 className="size-24 animate-spin mt-48" />
          </div>
        )}

        {dispatches && (
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex justify-center mb-4">
              <TabsTrigger value="Todos">Todos</TabsTrigger>
              <TabsTrigger value="APROBADA">Aprobados</TabsTrigger>
              <TabsTrigger value="CERRADO">Cerrados</TabsTrigger>
            </TabsList>

            <TabsContent value={activeCategory}>
              <DataTable columns={columns} data={rows} />
            </TabsContent>
          </Tabs>
        )}

        {isError && <p className="text-sm text-muted-foreground">Ha ocurrido un error al cargar las solicitudes...</p>}
      </div>
    </ContentLayout>
  );
};

export default DispatchRequestPage;
