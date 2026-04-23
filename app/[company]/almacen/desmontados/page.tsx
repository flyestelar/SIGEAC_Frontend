'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, PackageX, Search } from 'lucide-react';

import { ContentLayout } from '@/components/layout/ContentLayout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { useCompanyStore } from '@/stores/CompanyStore';
import { articleListOptions } from '@api/queries';

import { columns } from './columns';
import { DataTable } from './data-table';

const DismountedPage = () => {
  const { selectedCompany } = useCompanyStore();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, perPage]);

  const { data, isLoading, isError, isFetching } = useQuery(
    articleListOptions({
      query: {
        status: 'DISMOUNTED',
        page,
        per_page: perPage,
        search: deferredSearch.trim() || null,
      },
    }),
  );

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <ContentLayout title="Componentes Desmontados">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${selectedCompany?.slug}/dashboard`}>Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Almacén</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Desmontados</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="rounded-lg border bg-background">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/30">
                <PackageX className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold leading-tight">Componentes Desmontados</h1>
                <p className="text-sm text-foreground/80">
                  Inventario de componentes removidos de aeronaves. Busca por serial o part number.
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {typeof meta?.total === 'number' ? `${meta.total} registro(s)` : '—'}
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por serial o PN..."
                className="h-9 pl-9"
              />
              {isFetching && !isLoading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[280px] items-center justify-center rounded-lg border bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="rounded-lg border bg-background p-6 text-center text-sm text-muted-foreground">
            Ha ocurrido un error al cargar los componentes desmontados.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            page={meta?.current_page ?? 1}
            lastPage={meta?.last_page ?? 1}
            perPage={meta?.per_page ?? perPage}
            total={meta?.total ?? 0}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        )}
      </div>
    </ContentLayout>
  );
};

export default DismountedPage;
