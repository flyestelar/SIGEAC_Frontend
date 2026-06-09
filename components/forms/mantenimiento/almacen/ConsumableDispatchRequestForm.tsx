'use client';

import { useCreateDispatchRequest } from '@/actions/mantenimiento/almacen/solicitudes/salida/action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useGetThirdParties } from '@/hooks/ajustes/globales/terceros/useGetThirdParties';
import { useGetWarehousesEmployees } from '@/hooks/mantenimiento/almacen/empleados/useGetWarehousesEmployees';
import { useGetBatchesWithInWarehouseArticles } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesWithInWarehouseArticles';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useGetWorkshopsByLocation } from '@/hooks/sistema/empresas/talleres/useGetWorkshopsByLocation';
import { useGetEmployeesByDepartment } from '@/hooks/sistema/useGetEmployeesByDepartament';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Batch, Consumable, Employee, ThirdParty } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Building2,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Droplet,
  Handshake,
  Loader2,
  Package,
  Plane,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const FormSchema = z
  .object({
    dispatch_type: z.enum(['aircraft', 'workshop', 'loan'], {
      message: 'Debe seleccionar el tipo de despacho.',
    }),
    request_number: z.string().min(1, 'El número de requerimiento es obligatorio'),
    submission_date: z.date({ message: 'Debe ingresar la fecha.' }),
    delivered_by: z.string().min(1, 'Debe seleccionar quién entrega.'),
    status: z.string(),
    requested_by: z.string().optional(),
    aircraft_id: z.string().optional(),
    workshop_id: z.string().optional(),
    third_party_id: z.string().optional(),
    justification: z.string().optional(),
    articles: z
      .array(
        z.object({
          article_id: z.coerce.number(),
          serial: z.string().nullable(),
          quantity: z.number().positive('La cantidad debe ser mayor a 0'),
          batch_id: z.number(),
          unit: z.enum(['litros', 'mililitros']).optional(),
        }),
      )
      .min(1, 'Debe agregar al menos un artículo'),
  })
  .superRefine((d, ctx) => {
    if (d.dispatch_type === 'aircraft') {
      if (!d.aircraft_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Seleccione una aeronave.',
          path: ['aircraft_id'],
        });
      }
      if (!d.requested_by || d.requested_by.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe seleccionar el técnico responsable.',
          path: ['requested_by'],
        });
      }
    }

    if (d.dispatch_type === 'workshop') {
      if (!d.workshop_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Seleccione un taller.',
          path: ['workshop_id'],
        });
      }
      if (!d.requested_by || d.requested_by.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe seleccionar el técnico responsable.',
          path: ['requested_by'],
        });
      }
    }

    if (d.dispatch_type === 'loan') {
      if (!d.third_party_id || d.third_party_id.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe seleccionar la empresa para el préstamo.',
          path: ['third_party_id'],
        });
      }
    }
  });

type FormSchemaType = z.infer<typeof FormSchema>;
type DispatchType = 'aircraft' | 'workshop' | 'loan';

interface FormProps {
  onClose: () => void;
}

const DISPATCH_CONFIG: Record<
  DispatchType,
  {
    label: string;
    icon: typeof Plane;
    stripBg: string;
    stripBorder: string;
    iconBg: string;
    iconBorder: string;
    iconText: string;
    accentText: string;
    activeBg: string;
    activeText: string;
  }
> = {
  aircraft: {
    label: 'Aeronave',
    icon: Plane,
    stripBg: 'bg-sky-50 dark:bg-sky-950/20',
    stripBorder: 'border-sky-200 dark:border-sky-800/40',
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    iconBorder: 'border-sky-300 dark:border-sky-700/50',
    iconText: 'text-sky-700 dark:text-sky-300',
    accentText: 'text-sky-700 dark:text-sky-300',
    activeBg: 'bg-sky-50 dark:bg-sky-950/30',
    activeText: 'text-sky-700 dark:text-sky-300',
  },
  workshop: {
    label: 'Taller',
    icon: Wrench,
    stripBg: 'bg-orange-50 dark:bg-orange-950/20',
    stripBorder: 'border-orange-200 dark:border-orange-800/40',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconBorder: 'border-orange-300 dark:border-orange-700/50',
    iconText: 'text-orange-700 dark:text-orange-300',
    accentText: 'text-orange-700 dark:text-orange-300',
    activeBg: 'bg-orange-50 dark:bg-orange-950/30',
    activeText: 'text-orange-700 dark:text-orange-300',
  },
  loan: {
    label: 'Préstamo',
    icon: Handshake,
    stripBg: 'bg-indigo-50 dark:bg-indigo-950/20',
    stripBorder: 'border-indigo-200 dark:border-indigo-800/40',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconBorder: 'border-indigo-300 dark:border-indigo-700/50',
    iconText: 'text-indigo-700 dark:text-indigo-300',
    accentText: 'text-indigo-700 dark:text-indigo-300',
    activeBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    activeText: 'text-indigo-700 dark:text-indigo-300',
  },
};

const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-widest text-muted-foreground';
const SECTION_HEADER = 'flex items-center gap-2 border-b px-5 py-3';
const SECTION_TITLE = 'text-[11px] font-semibold uppercase tracking-widest text-muted-foreground';

function SectionHeader({ icon: Icon, title }: { icon: typeof Plane; title: string }) {
  return (
    <div className={SECTION_HEADER}>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className={SECTION_TITLE}>{title}</span>
    </div>
  );
}

export function ConsumableDispatchForm({ onClose }: FormProps) {
  const { user } = useAuth();
  const { selectedCompany, selectedStation } = useCompanyStore();
  const [openRequestedBy, setOpenRequestedBy] = useState(false);
  const [requestBy, setRequestedBy] = useState<Employee>();
  const { createDispatchRequest } = useCreateDispatchRequest();
  const { data: thirdParty, isLoading: isThirdPartyLoading, isError: isThirdPartyError } = useGetThirdParties();
  const {
    data: aircrafts,
    isLoading: isAircraftsLoading,
    isError: isAircraftsError,
  } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const { data: workshops, isLoading: isWorkshopsLoading, isError: isWorkshopsError } = useGetWorkshopsByLocation();
  const { data: batches, isPending: isBatchesLoading } = useGetBatchesWithInWarehouseArticles('CONSUMIBLE');
  const {
    data: employees,
    isLoading: employeesLoading,
    isError: employeesError,
  } = useGetEmployeesByDepartment('MANP', selectedStation, selectedCompany?.slug);
  const {
    data: warehouseEmployees,
    isLoading: warehouseEmployeesLoading,
    isError: warehouseEmployeesError,
  } = useGetWarehousesEmployees();

  const consumableBatches = useMemo(
    () => (batches ?? []).filter((b) => b.category === 'CONSUMIBLE' || !b.category),
    [batches],
  );

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      justification: '',
      requested_by: `${user?.employee?.[0]?.dni ?? ''}`,
      dispatch_type: 'aircraft',
      status: 'proceso',
      submission_date: new Date(),
      articles: [{ article_id: 0, serial: null, quantity: 0, batch_id: 0, unit: undefined }],
    },
  });

  const { control, watch, setValue, setError, clearErrors } = form;
  const { fields, append, remove, update } = useFieldArray({ control, name: 'articles' });
  const dispatchType = watch('dispatch_type');
  const cfg = DISPATCH_CONFIG[dispatchType];

  const findBatchById = (batch_id: number): Batch | null =>
    consumableBatches.find((b) => b.batch_id === batch_id) ?? null;

  const findArticleById = (id: number): Consumable | undefined =>
    consumableBatches.flatMap((b) => b.articles).find((a) => a.id === id) as Consumable | undefined;

  function handleArticleSelectAtRow(rowIndex: number, id: number, serial: string | null, batch_id: number) {
    const batch = findBatchById(batch_id);
    if (!batch) return;
    update(rowIndex, {
      article_id: Number(id),
      serial: serial ?? null,
      quantity: 0,
      batch_id: Number(batch_id),
      unit: batch.unit?.value?.toUpperCase() === 'L' ? 'litros' : undefined,
    });
    clearErrors([`articles.${rowIndex}.quantity`, `articles.${rowIndex}.unit`]);
  }

  function validateQuantityAtRow(rowIndex: number, raw: string, article_id?: number) {
    if (!article_id) return;
    const trimmed = raw.trim();

    if (trimmed === '') {
      setValue(`articles.${rowIndex}.quantity`, 0, { shouldValidate: true, shouldDirty: true });
      clearErrors(`articles.${rowIndex}.quantity`);
      return;
    }

    const art = findArticleById(article_id);
    if (!art) return;

    const value = Number(trimmed.replace(',', '.'));

    if (Number.isNaN(value)) {
      setError(`articles.${rowIndex}.quantity`, { type: 'manual', message: 'Formato de número inválido' });
      return;
    }

    if (value <= 0) {
      setError(`articles.${rowIndex}.quantity`, { type: 'manual', message: 'La cantidad debe ser mayor a 0' });
      return;
    }

    if (!Number.isInteger(value)) {
      setError(`articles.${rowIndex}.quantity`, { type: 'manual', message: 'La cantidad debe ser un número entero' });
      return;
    }

    const available = Number(art.quantity ?? 0);

    if (value > available) {
      setError(`articles.${rowIndex}.quantity`, {
        type: 'manual',
        message: `La cantidad solicitada supera el disponible (${available}).`,
      });
      return;
    }

    clearErrors(`articles.${rowIndex}.quantity`);
    setValue(`articles.${rowIndex}.quantity`, value, { shouldValidate: true, shouldDirty: true });
  }

  const onSubmit = async (data: FormSchemaType) => {
    for (let i = 0; i < data.articles.length; i++) {
      const row = data.articles[i];
      const art = findArticleById(row.article_id);
      if (!art) continue;

      const available = Number(art.quantity ?? 0);

      if (row.quantity > available) {
        setError(`articles.${i}.quantity`, {
          type: 'manual',
          message: `La cantidad solicitada supera el disponible (${available}).`,
        });
        return;
      }
    }

    const payload = {
      ...data,
      created_by: user!.username,
      submission_date: format(data.submission_date, 'yyyy-MM-dd'),
      category: 'consumible',
      status: 'APROBADO',
      approved_by: user?.employee?.[0]?.dni,
      delivered_by: data.delivered_by,
      user_id: Number(user!.id),
    };
    await createDispatchRequest.mutateAsync({ data: payload, company: selectedCompany!.slug });
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full">
        {/* § Cabecera */}
        <section className="overflow-hidden rounded-lg border bg-background">
          <SectionHeader icon={Droplet} title="Cabecera" />
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="request_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={FIELD_LABEL}>N.º Solicitud</FormLabel>
                  <FormControl>
                    <Input className="font-mono" placeholder="Ej: REQ-00123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="submission_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={FIELD_LABEL}>Fecha de Solicitud</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn('justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                          {field.value ? format(field.value, 'PPP', { locale: es }) : 'Seleccione una fecha...'}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* § Destino */}
        <section className="overflow-hidden rounded-lg border bg-background">
          <SectionHeader icon={cfg.icon} title="Destino del Despacho" />

          <FormField
            control={form.control}
            name="dispatch_type"
            render={({ field }) => (
              <FormItem className="px-5 pt-4">
                <FormLabel className={FIELD_LABEL}>Tipo</FormLabel>
                <FormControl>
                  <div className="mt-1.5 grid grid-cols-3 gap-0 overflow-hidden rounded-md border">
                    {(Object.keys(DISPATCH_CONFIG) as DispatchType[]).map((key, i) => {
                      const c = DISPATCH_CONFIG[key];
                      const Icon = c.icon;
                      const active = field.value === key;
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => field.onChange(key)}
                          className={cn(
                            'flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                            i > 0 && 'border-l',
                            active
                              ? cn(c.activeBg, c.activeText)
                              : 'bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className={cn('mt-4 flex items-center gap-3 border-y px-5 py-2.5', cfg.stripBg, cfg.stripBorder)}>
            <div
              className={cn('flex h-6 w-6 items-center justify-center rounded border', cfg.iconBg, cfg.iconBorder)}
            >
              <cfg.icon className={cn('h-3 w-3', cfg.iconText)} />
            </div>
            <span className={cn('text-[11px] font-bold uppercase tracking-widest', cfg.accentText)}>
              Despacho hacia {cfg.label}
            </span>
          </div>

          <div className="p-5">
            {dispatchType === 'aircraft' && (
              <FormField
                control={form.control}
                name="aircraft_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={FIELD_LABEL}>Aeronave</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={isAircraftsLoading || isAircraftsError}
                            variant="outline"
                            role="combobox"
                            className={cn('justify-between font-mono', !field.value && 'text-muted-foreground font-sans')}
                          >
                            {isAircraftsLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                            {field.value
                              ? aircrafts?.find((a) => `${a.id}` === field.value)?.acronym
                              : 'Elige la aeronave...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput placeholder="Busque una aeronave..." />
                          <CommandList>
                            <CommandEmpty className="text-xs p-2 text-center">
                              No se ha encontrado ninguna aeronave.
                            </CommandEmpty>
                            <CommandGroup>
                              {aircrafts?.map((aircraft) => (
                                <CommandItem
                                  value={`${aircraft.acronym}`}
                                  key={aircraft.id}
                                  onSelect={() => {
                                    form.setValue('aircraft_id', aircraft.id.toString(), { shouldValidate: true });
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      `${aircraft.id}` === field.value ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  <span className="font-mono">{aircraft.acronym}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {dispatchType === 'workshop' && (
              <FormField
                control={form.control}
                name="workshop_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={FIELD_LABEL}>Taller</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={isWorkshopsLoading || isWorkshopsError}
                            variant="outline"
                            role="combobox"
                            className={cn('justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {isWorkshopsLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                            {field.value
                              ? workshops?.find((ws) => `${ws.id}` === field.value)?.name
                              : 'Elige el taller...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput placeholder="Busque un taller..." />
                          <CommandList>
                            <CommandEmpty className="text-xs p-2 text-center">
                              No se ha encontrado ningun taller.
                            </CommandEmpty>
                            <CommandGroup>
                              {workshops?.map((workshop) => (
                                <CommandItem
                                  value={`${workshop.id}`}
                                  key={workshop.id}
                                  onSelect={() => {
                                    form.setValue('workshop_id', workshop.id.toString(), { shouldValidate: true });
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      `${workshop.id}` === field.value ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  {workshop.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {dispatchType === 'loan' && (
              <FormField
                control={form.control}
                name="third_party_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={FIELD_LABEL}>Empresa del Préstamo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={isThirdPartyLoading || isThirdPartyError}
                            variant="outline"
                            role="combobox"
                            className={cn('justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {isThirdPartyLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                            {field.value
                              ? thirdParty?.find((t: ThirdParty) => `${t.id}` === `${field.value}`)?.name
                              : 'Seleccione la empresa...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar empresa..." />
                          <CommandList>
                            <CommandEmpty className="text-xs p-2 text-center">
                              {isThirdPartyError ? 'Error al cargar empresas.' : 'No se encontraron resultados.'}
                            </CommandEmpty>
                            <CommandGroup>
                              {thirdParty?.map((t: ThirdParty) => (
                                <CommandItem
                                  key={t.id}
                                  value={t.name}
                                  onSelect={() => {
                                    form.setValue('third_party_id', t.id.toString(), { shouldValidate: true });
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      `${t.id}` === `${field.value}` ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{t.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">
                                      {t.party_roles.map((role) => role.label).join(', ')}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </section>

        {/* § Responsables */}
        <section className="overflow-hidden rounded-lg border bg-background">
          <SectionHeader icon={Building2} title="Responsables" />
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="delivered_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={FIELD_LABEL}>Entregado por (Almacén)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el responsable..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouseEmployeesLoading && <Loader2 className="size-4 animate-spin mx-2 my-1" />}
                      {warehouseEmployeesError && (
                        <div className="px-2 py-1 text-destructive text-sm">Error cargando personal de almacén</div>
                      )}
                      {warehouseEmployees?.map((employee) => (
                        <SelectItem key={employee.dni} value={`${employee.dni}`}>
                          {employee.first_name} {employee.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {dispatchType !== 'loan' && (
              <FormField
                control={form.control}
                name="requested_by"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={FIELD_LABEL}>Técnico Responsable</FormLabel>
                    <Popover open={openRequestedBy} onOpenChange={setOpenRequestedBy}>
                      <PopoverTrigger asChild>
                        <Button
                          disabled={employeesLoading || employeesError}
                          variant="outline"
                          role="combobox"
                          aria-expanded={openRequestedBy}
                          className={cn('justify-between', !field.value && !requestBy && 'text-muted-foreground')}
                        >
                          {requestBy
                            ? `${requestBy.first_name} ${requestBy.last_name}`
                            : (() => {
                                const dni = field.value;
                                const found = employees?.find((e) => String(e.dni) === String(dni));
                                return found ? `${found.first_name} ${found.last_name}` : 'Selec. el técnico';
                              })()}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[260px] p-0">
                        <Command>
                          <CommandInput placeholder="Selec. el técnico..." />
                          <CommandList>
                            <CommandEmpty>No se han encontrado técnicos...</CommandEmpty>
                            {employees?.map((e) => (
                              <CommandItem
                                value={`${e.first_name} ${e.last_name} ${e.dni}`}
                                key={e.id}
                                onSelect={() => {
                                  setRequestedBy(e);
                                  form.setValue('requested_by', String(e.dni), {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });
                                  setOpenRequestedBy(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    String(requestBy?.dni ?? field.value) === String(e.dni)
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                                {`${e.first_name} ${e.last_name}`}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </section>

        {/* § Artículos */}
        <section className="overflow-hidden rounded-lg border bg-background">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={SECTION_TITLE}>Consumibles</span>
              {fields.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] font-mono">
                  {fields.length}
                </Badge>
              )}
            </div>
            <Button
              disabled={isBatchesLoading}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ article_id: 0, serial: null, quantity: 0, batch_id: 0, unit: undefined })}
              className="h-8 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" /> Agregar
            </Button>
          </div>

          <ScrollArea className={fields.length > 2 ? 'h-[300px]' : ''}>
            <ul className="divide-y">
              {fields.map((field, idx) => {
                const currentBatch = findBatchById(watch(`articles.${idx}.batch_id`));
                const unitType = currentBatch?.unit?.value?.toUpperCase();
                const selectedArticleId = watch(`articles.${idx}.article_id`);
                const selectedArticle = selectedArticleId ? findArticleById(selectedArticleId) : undefined;
                const available = Number(selectedArticle?.quantity ?? 0);

                return (
                  <li key={field.id} className="space-y-3 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <span className={FIELD_LABEL}>Consumible #{idx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(idx)}
                        title="Quitar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
                      {/* Selector */}
                      <FormField
                        control={form.control}
                        name={`articles.${idx}.article_id`}
                        render={() => (
                          <FormItem className="flex flex-col">
                            <FormLabel className={FIELD_LABEL}>Artículo</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  disabled={isBatchesLoading}
                                  variant="outline"
                                  role="combobox"
                                  className="justify-between h-auto py-2"
                                >
                                  {isBatchesLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Loader2 className="size-4 animate-spin" />
                                      <span>Cargando…</span>
                                    </div>
                                  ) : selectedArticle ? (
                                    <div className="flex w-full items-center justify-between gap-2 text-left">
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                          {currentBatch?.name}
                                        </span>
                                        <span className="truncate font-mono text-sm">
                                          {selectedArticle.part_number}
                                          {selectedArticle.serial && (
                                            <span className="text-xs text-muted-foreground">
                                              {' · '}
                                              {selectedArticle.serial}
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      <span
                                        className={cn(
                                          'shrink-0 font-mono text-xs tabular-nums',
                                          available > 0 ? 'text-muted-foreground' : 'text-destructive',
                                        )}
                                      >
                                        {available} u
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Selec. el consumible</span>
                                  )}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[360px] p-0">
                                <Command>
                                  <CommandInput placeholder="Buscar por P/N o serial..." />
                                  <CommandList>
                                    <CommandEmpty>No se han encontrado consumibles...</CommandEmpty>
                                    {consumableBatches?.map((b) => (
                                      <CommandGroup key={b.batch_id} heading={`${b.name} · ${b.unit?.label ?? ''}`}>
                                        {b.articles.map((a) => (
                                          <CommandItem
                                            value={`${a.part_number} ${a.serial ?? ''} ${a.id}`}
                                            key={a.id}
                                            disabled={Number(a.quantity ?? 0) <= 0}
                                            onSelect={() => {
                                              if (Number(a.quantity ?? 0) <= 0) return;
                                              handleArticleSelectAtRow(idx, a.id!, a.serial ?? null, b.batch_id);
                                            }}
                                            className={cn(
                                              'flex items-center justify-between gap-3',
                                              Number(a.quantity ?? 0) <= 0 && 'opacity-60 cursor-not-allowed',
                                            )}
                                          >
                                            <div className="flex flex-col min-w-0">
                                              <span className="truncate font-mono text-sm font-medium">
                                                {a.part_number}
                                              </span>
                                              <span className="truncate text-xs text-muted-foreground">
                                                Serial: {a.serial ?? 'N/A'}
                                              </span>
                                            </div>
                                            <Badge
                                              variant={Number(a.quantity ?? 0) > 0 ? 'secondary' : 'outline'}
                                              className={cn(
                                                'font-mono text-[10px]',
                                                Number(a.quantity ?? 0) <= 0 && 'text-destructive border-destructive',
                                              )}
                                            >
                                              {Number(a.quantity ?? 0) > 0 ? `Disp: ${a.quantity}` : 'Sin stock'}
                                            </Badge>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    ))}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Cantidad */}
                      <FormField
                        control={form.control}
                        name={`articles.${idx}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={FIELD_LABEL}>Cantidad</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  className="pr-20 font-mono tabular-nums"
                                  inputMode="numeric"
                                  placeholder={!selectedArticle ? 'Selec. consumible' : 'Ej: 1, 2, 3…'}
                                  value={field.value ?? ''}
                                  disabled={!selectedArticle}
                                  onChange={(e) => validateQuantityAtRow(idx, e.target.value, selectedArticle?.id)}
                                />
                                <div className="absolute inset-y-0 right-2 flex items-center">
                                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono">
                                    {selectedArticle ? `/ ${available}` : '/ -'}
                                  </Badge>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {unitType === 'L' && (
                      <FormField
                        control={form.control}
                        name={`articles.${idx}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={FIELD_LABEL}>Unidad</FormLabel>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-1">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="litros" id={`litros-${idx}`} />
                                  <Label htmlFor={`litros-${idx}`} className="text-sm font-normal">
                                    Litros
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="mililitros" id={`ml-${idx}`} />
                                  <Label htmlFor={`ml-${idx}`} className="text-sm font-normal">
                                    Mililitros
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
          {form.formState.errors.articles?.message && (
            <p className="border-t px-5 py-2 text-xs text-destructive">{form.formState.errors.articles.message}</p>
          )}
        </section>

        {/* § Justificación */}
        <FormField
          control={form.control}
          name="justification"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL}>Justificación</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  className="w-full resize-none"
                  placeholder="EJ: Se necesita para la limpieza de…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={createDispatchRequest?.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createDispatchRequest?.isPending} className="min-w-[120px]">
            {createDispatchRequest?.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Crear Despacho'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
