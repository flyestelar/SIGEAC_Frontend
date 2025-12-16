'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, NotepadText, Plane, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

import DispatchReportPdf from '@/components/pdf/almacen/DispatchReport';
import { useGetAircrafts } from '@/hooks/aerolinea/aeronaves/useGetAircrafts';
import type { DispatchReport } from '@/hooks/mantenimiento/almacen/reportes/useGetDispatchReport';
import { useGetDispatchReport } from '@/hooks/mantenimiento/almacen/reportes/useGetDispatchReport';
import { useGetWorkshopsByLocation } from '@/hooks/sistema/empresas/talleres/useGetWorkshopsByLocation';
import { useCompanyStore } from '@/stores/CompanyStore';

// ⬇️ AJUSTA este import a tu ruta real

export function DispatchReportDialog() {
  const { selectedStation, selectedCompany } = useCompanyStore();

  const [open, setOpen] = useState(false);

  const [aircraft, setAircraft] = useState<string>('all');
  const [workshop, setWorkshop] = useState<string>('all'); // ✅ nuevo

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { data: aircrafts, isLoading: isLoadingAircrafts } = useGetAircrafts(selectedCompany?.slug);

  // ✅ nuevo: lista de talleres
  const { data: workshops, isLoading: isLoadingWorkshops } = useGetWorkshopsByLocation();

  const {
    mutate: generateReport,
    data: dispatchReport,
    isPending: isLoadingDispatchReport,
    isError,
    error,
  } = useGetDispatchReport();

  const isDateRangeInvalid = startDate && endDate && endDate < startDate;

  const aircraftFilter = useMemo(() => (aircraft && aircraft !== 'all' ? parseInt(aircraft, 10) : null), [aircraft]);

  const workshopFilter = useMemo(() => (workshop && workshop !== 'all' ? parseInt(workshop, 10) : null), [workshop]);

  const filename = useMemo(() => {
    const parts: string[] = ['salidas'];
    if (aircraftFilter) parts.push(`avion_${aircraftFilter}`);
    if (workshopFilter) parts.push(`taller_${workshopFilter}`);

    if (startDate && endDate) {
      parts.push(
        `${format(startDate, 'dd-MM-yyyy', { locale: es })}_a_${format(endDate, 'dd-MM-yyyy', { locale: es })}`,
      );
    } else {
      parts.push(format(new Date(), 'dd-MM-yyyy', { locale: es }));
    }
    return `${parts.join('_')}.pdf`;
  }, [aircraftFilter, workshopFilter, startDate, endDate]);

  const onGenerate = () => {
    if (!selectedCompany?.slug || !selectedStation) return;
    if (isDateRangeInvalid) return;

    generateReport({
      aircraft_id: aircraftFilter,
      workshop_id: workshopFilter, // ✅ aquí
      from: startDate ?? null,
      to: endDate ?? null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="flex items-center justify-center gap-2 h-8 border-dashed"
        >
          Generar Reporte
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Generar Reporte</DialogTitle>
          <DialogDescription>Aquí se pueden generar los reportes del almacén.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex flex-col justify-center text-center">
          <div className="space-y-2">
            <h1 className="text-xl font-bold flex gap-2 items-center justify-center">
              Reporte <NotepadText />
            </h1>
            <p className="text-muted-foreground text-sm italic">Descargue el reporte general o aplique filtros.</p>
          </div>

          {/* Filtros (minimalista: dos selects, mismo patrón) */}
          <div className="space-y-4">
            {/* Avión */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold flex gap-2 items-center justify-center">
                Aeronave <Plane />
              </h2>

              <div className="flex gap-2 items-center justify-center">
                <Select value={aircraft} onValueChange={setAircraft}>
                  <SelectTrigger disabled={isLoadingAircrafts} className="w-[240px]">
                    <SelectValue placeholder="Todos los aviones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los aviones</SelectItem>
                    {aircrafts?.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.acronym ?? `Aeronave #${a.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Taller ✅ nuevo */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold flex gap-2 items-center justify-center">
                Taller <Wrench />
              </h2>

              <div className="flex gap-2 items-center justify-center">
                <Select value={workshop} onValueChange={setWorkshop}>
                  <SelectTrigger disabled={isLoadingWorkshops} className="w-[240px]">
                    <SelectValue placeholder="Todos los talleres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los talleres</SelectItem>
                    {workshops?.map((w: { id: number; name?: string }) => (
                      <SelectItem key={w.id} value={w.id.toString()}>
                        {w.name ?? `Taller #${w.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Rango de Fechas */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold flex gap-2 items-center justify-center">
              Rango de Fecha <CalendarDays />
            </h2>
            <p className="text-muted-foreground text-sm italic">Opcional: seleccione un rango para filtrar.</p>

            <div className="flex flex-col md:flex-row justify-center gap-4 items-center">
              <div className="flex flex-col items-start">
                <label className="text-xs font-medium">Desde</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-[200px] justify-start text-left', !startDate && 'text-muted-foreground')}
                    >
                      {startDate ? format(startDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col items-start">
                <label className="text-xs font-medium">Hasta</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-[200px] justify-start text-left', !endDate && 'text-muted-foreground')}
                    >
                      {endDate ? format(endDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => (startDate ? date < startDate : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {isDateRangeInvalid && (
              <p className="text-sm text-red-600">El rango de fechas no es válido (hasta antes de desde).</p>
            )}
          </div>

          {/* Botones */}
          <div className="pt-2 flex flex-col items-center gap-2">
            <Button
              onClick={onGenerate}
              disabled={isLoadingDispatchReport || isDateRangeInvalid || !selectedCompany?.slug || !selectedStation}
              className="mt-2"
            >
              {isLoadingDispatchReport ? 'Generando...' : 'Generar Reporte'}
            </Button>

            {isError && (
              <p className="text-sm text-red-600">Error al generar reporte: {error?.message ?? 'Desconocido'}</p>
            )}

            {dispatchReport && dispatchReport.length > 0 ? (
              <PDFDownloadLink
                key={
                  filename +
                  (aircraftFilter ?? 'all') +
                  (workshopFilter ?? 'all') +
                  (startDate ? startDate.toISOString() : '') +
                  (endDate ? endDate.toISOString() : '')
                }
                fileName={filename}
                document={
                  <DispatchReportPdf
                    reports={dispatchReport as DispatchReport[]}
                    aircraftFilter={aircraftFilter}
                    startDate={startDate}
                    endDate={endDate}
                    // si tu PDF también quiere mostrar el taller filtrado:
                    // workshopFilter={workshopFilter}
                  />
                }
              >
                <Button disabled={isLoadingDispatchReport} variant="outline" className="mt-2">
                  {isLoadingDispatchReport ? 'Preparando PDF...' : 'Descargar Reporte'}
                </Button>
              </PDFDownloadLink>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isLoadingDispatchReport ? 'Generando reporte...' : 'Aún no hay datos para descargar.'}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
