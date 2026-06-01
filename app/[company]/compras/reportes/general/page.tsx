'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import DateFilter from '@/components/misc/DateFilter';
import GeneralSalesReportPdf from '@/components/pdf/compras/GeneralSalesReport';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useGetGeneralReport } from '@/hooks/mantenimiento/compras/useGetGeneralReport';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, FileDown, Loader2 } from 'lucide-react';

const GeneralReportPage = () => {
  const { selectedCompany } = useCompanyStore();
  const { data: report, isError, isLoading } = useGetGeneralReport();
  const slug = selectedCompany?.slug;

  return (
    <ContentLayout title="Reporte General">
      <div className="flex flex-col gap-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${slug}/dashboard`}>Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Compras</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <BreadcrumbLink href={`/${slug}/almacen/compras/reportes/general`}>
                      Reporte General
                    </BreadcrumbLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <BreadcrumbLink href={`/${slug}/almacen/compras/reportes/aeronaves`}>
                      Reporte de Aeronaves
                    </BreadcrumbLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <BreadcrumbLink href={`/${slug}/almacen/compras/reportes/proveedores`}>
                      Reportes de Proveedores
                    </BreadcrumbLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Reporte General</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="space-y-1.5 border-b pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Compras · Reportes
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Reporte General</h1>
          <p className="text-sm text-foreground/70">
            Genera un reporte consolidado de compras en el rango de fechas seleccionado.
          </p>
        </header>

        <div className="rounded-lg border bg-background">
          <div className="border-b px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Rango de fechas
            </p>
          </div>
          <div className="p-5">
            <DateFilter />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3"
            >
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <Skeleton className="h-3 w-48" />
            </motion.div>
          ) : isError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3"
            >
              <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">
                No se pudo cargar el reporte general.
              </p>
            </motion.div>
          ) : report ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-center justify-between gap-4 rounded-lg border bg-background px-5 py-4"
            >
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Reporte listo
                </p>
                <p className="text-sm font-medium">
                  Descarga el PDF consolidado del periodo seleccionado.
                </p>
              </div>
              <PDFDownloadLink
                fileName="reporte_general_compras.pdf"
                document={<GeneralSalesReportPdf reports={report} />}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/5 px-3 text-sm font-medium text-red-700 transition-all',
                  'hover:border-red-500/50 hover:bg-red-500/10',
                  'dark:text-red-300',
                )}
              >
                <FileDown className="size-4" />
                <span>Descargar PDF</span>
              </PDFDownloadLink>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </ContentLayout>
  );
};

export default GeneralReportPage;
