'use client';

import { useCreateDispatchRequest } from '@/actions/mantenimiento/almacen/solicitudes/salida/action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { Employee, ThirdParty } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Building2,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Handshake,
  Loader2,
  Package,
  Plane,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const FormSchema = z
  .object({
    dispatch_type: z.enum(['aircraft', 'workshop', 'loan'], {
      message: 'Debe seleccionar si el despacho es para una Aeronave, Taller o Préstamo.',
    }),
    request_number: z.string().min(1, 'El número de requerimiento es obligatorio'),
    third_party_id: z.string().optional(),
    requested_by: z.string().optional(),
    delivered_by: z.string().min(1, 'Debe seleccionar el responsable de almacén.'),
    aircraft_id: z.string().optional(),
    workshop_id: z.string().optional(),
    submission_date: z.date({ message: 'Debe ingresar la fecha.' }),
    articles: z
      .array(
        z.object({
          article_id: z.coerce.number(),
          serial: z.string().nullable(),
          quantity: z.number().int().positive(),
          batch: z.string(),
          batch_id: z.number(),
        }),
      )
      .min(1, 'Debe seleccionar al menos un componente.'),
    justification: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.dispatch_type !== 'loan') {
      if (!data.requested_by || data.requested_by.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe seleccionar el técnico responsable.',
          path: ['requested_by'],
        });
      }
    }

    if (data.dispatch_type === 'loan') {
      if (!data.third_party_id || data.third_party_id.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe indicar la empresa para el préstamo.',
          path: ['third_party_id'],
        });
      }
    }

    if (data.dispatch_type === 'aircraft' && !data.aircraft_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe seleccionar una Aeronave.',
        path: ['aircraft_id'],
      });
    }

    if (data.dispatch_type === 'workshop' && !data.workshop_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe seleccionar un Taller.',
        path: ['workshop_id'],
      });
    }
  });

type FormSchemaType = z.infer<typeof FormSchema>;
type DispatchType = 'aircraft' | 'workshop' | 'loan';

interface PickedComponent {
  id: number;
  serial: string | null;
  part_number: string;
  batch_id: number;
  batch: string;
  is_serialized: boolean;
  quantity: number;
}

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
    activeBorder: string;
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
    activeBorder: 'border-sky-300 dark:border-sky-700/60',
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
    activeBorder: 'border-orange-300 dark:border-orange-700/60',
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
    activeBorder: 'border-indigo-300 dark:border-indigo-700/60',
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

export function ComponentDispatchForm({ onClose }: FormProps) {
  const { user } = useAuth();
  const { selectedCompany, selectedStation } = useCompanyStore();
  const { createDispatchRequest } = useCreateDispatchRequest();

  const [openComponents, setOpenComponents] = useState(false);
  const [openRequestedBy, setOpenRequestedBy] = useState(false);
  const [requestBy, setRequestedBy] = useState<Employee>();
  const [selectedComponents, setSelectedComponents] = useState<PickedComponent[]>([]);

  const { data: thirdParty, isLoading: isThirdPartyLoading, isError: isThirdPartyError } = useGetThirdParties();
  const {
    data: batches,
    isLoading: isBatchesLoading,
    isError: isBatchesError,
  } = useGetBatchesWithInWarehouseArticles('COMPONENTE');
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
  const {
    data: aircrafts,
    isLoading: isAircraftsLoading,
    isError: isAircraftsError,
  } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const { data: workshops, isLoading: isWorkshopsLoading, isError: isWorkshopsError } = useGetWorkshopsByLocation();

  const componentBatches = useMemo(
    () => (batches ?? []).filter((b) => b.category === 'COMPONENTE' || !b.category),
    [batches],
  );

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      articles: [],
      justification: '',
      submission_date: new Date(),
      requested_by: user?.employee?.[0]?.dni ? String(user.employee[0].dni) : '',
    },
  });

  const dispatchType = form.watch('dispatch_type');
  const cfg = dispatchType ? DISPATCH_CONFIG[dispatchType] : null;

  const toArticles = (components: PickedComponent[]) =>
    components.map((c) => ({
      article_id: c.id,
      serial: c.serial,
      quantity: c.is_serialized ? 1 : c.quantity,
      batch_id: c.batch_id,
      batch: c.batch,
    }));

  const addOrRemoveComponent = (item: {
    id: number;
    serial: string | null;
    part_number: string;
    batch_id: number;
    batch: string;
  }) => {
    const exists = selectedComponents.find((c) => c.id === item.id);
    const next = exists
      ? selectedComponents.filter((c) => c.id !== item.id)
      : [...selectedComponents, { ...item, is_serialized: !!item.serial, quantity: 1 }];
    setSelectedComponents(next);
    form.setValue('articles', toArticles(next), { shouldValidate: true });
  };

  const updateQuantity = (id: number, qty: number) => {
    const next = selectedComponents.map((c) =>
      c.id === id ? { ...c, quantity: Math.max(1, Math.floor(qty || 1)) } : c,
    );
    setSelectedComponents(next);
    form.setValue('articles', toArticles(next), { shouldValidate: true });
  };

  const removeComponent = (id: number) => {
    const next = selectedComponents.filter((c) => c.id !== id);
    setSelectedComponents(next);
    form.setValue('articles', toArticles(next), { shouldValidate: true });
  };

  const onSubmit = async (data: FormSchemaType) => {
    const formattedData = {
      ...data,
      created_by: `${user?.first_name} ${user?.last_name}`,
      submission_date: format(data.submission_date, 'yyyy-MM-dd'),
      status: 'APROBADO',
      category: 'componente',
      approved_by: user?.employee?.[0]?.dni,
      delivered_by: data.delivered_by,
      user_id: Number(user!.id),
    };
    await createDispatchRequest.mutateAsync({
      data: formattedData,
      company: selectedCompany!.slug,
    });
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full">
        {/* § Cabecera */}
        <section className="overflow-hidden rounded-lg border bg-background">
          <SectionHeader icon={Package} title="Cabecera" />
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

        {/* § Destino — segmented + accent strip + entity picker */}
        <section className="overflow-hidden rounded-lg border bg-background">
          <SectionHeader icon={cfg?.icon ?? Plane} title="Destino del Despacho" />

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

          {cfg && (
            <div className={cn('mt-4 flex items-center gap-3 border-y px-5 py-2.5', cfg.stripBg, cfg.stripBorder)}>
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded border',
                  cfg.iconBg,
                  cfg.iconBorder,
                )}
              >
                <cfg.icon className={cn('h-3 w-3', cfg.iconText)} />
              </div>
              <span className={cn('text-[11px] font-bold uppercase tracking-widest', cfg.accentText)}>
                Despacho hacia {cfg.label}
              </span>
            </div>
          )}

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

            {!dispatchType && (
              <p className="text-sm text-muted-foreground">Seleccione el tipo de despacho para continuar.</p>
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
                                const found = employees?.find((e) => String(e.dni) === String(field.value));
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

        {/* § Componentes */}
        <section className="overflow-hidden rounded-lg border bg-background">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={SECTION_TITLE}>Componentes a Retirar</span>
              {selectedComponents.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] font-mono">
                  {selectedComponents.length}
                </Badge>
              )}
            </div>

            <Popover open={openComponents} onOpenChange={setOpenComponents}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  disabled={isBatchesLoading || isBatchesError}
                  variant="outline"
                  role="combobox"
                  aria-expanded={openComponents}
                  className="h-8 text-xs"
                >
                  {selectedComponents.length > 0 ? 'Agregar / Quitar' : 'Seleccionar'}
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-0" align="end">
                <Command
                  filter={(value, search) => {
                    if (!search) return 1;
                    const s = search.toLowerCase();
                    const tokens = value.toLowerCase().split(' ');
                    const searchable = tokens.slice(0, -1);
                    if (!searchable.join(' ').includes(s)) return 0;
                    if (searchable.some((t) => t.startsWith(s))) return 1;
                    return 0.5;
                  }}
                >
                  <CommandInput placeholder="Buscar componente..." />
                  <CommandList>
                    <CommandEmpty>No se han encontrado componentes...</CommandEmpty>
                    {componentBatches.map((batch) => (
                      <CommandGroup key={batch.batch_id} heading={batch.name}>
                        {batch.articles.map((article) => {
                          const picked = selectedComponents.find((c) => c.id === article.id);
                          return (
                            <CommandItem
                              value={`${batch.name} ${article.part_number} ${article.serial ?? ''} ${article.id}`}
                              key={article.id}
                              onSelect={() => {
                                addOrRemoveComponent({
                                  id: article.id!,
                                  serial: article.serial ?? null,
                                  part_number: article.part_number,
                                  batch_id: batch.batch_id,
                                  batch: batch.name,
                                });
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', picked ? 'opacity-100' : 'opacity-0')} />
                              <span className="font-mono truncate">
                                {article.serial ?? article.part_number}
                              </span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 px-5 py-8 text-center">
              <Package className="h-6 w-6 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No hay componentes seleccionados.</p>
              <p className="text-xs text-muted-foreground/70">Use el botón Seleccionar para añadir.</p>
            </div>
          ) : (
            <ScrollArea className={selectedComponents.length > 3 ? 'h-[220px]' : ''}>
              <ul className="divide-y">
                {selectedComponents.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase tracking-wide">
                          {c.batch}
                        </Badge>
                        {c.is_serialized && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                            Serializado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2 truncate">
                        <span className="truncate font-mono text-sm font-medium">{c.part_number}</span>
                        <span className="truncate font-mono text-xs text-muted-foreground">
                          {c.serial ?? 'S/N'}
                        </span>
                      </div>
                    </div>

                    {c.is_serialized ? (
                      <div className="flex items-center gap-1.5">
                        <span className={FIELD_LABEL}>Cant.</span>
                        <span className="font-mono text-sm font-medium tabular-nums">1</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={FIELD_LABEL}>Cant.</span>
                        <Input
                          type="number"
                          className="h-8 w-20 font-mono tabular-nums"
                          min={1}
                          value={c.quantity}
                          onChange={(e) => updateQuantity(c.id, Number(e.target.value))}
                        />
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeComponent(c.id)}
                      title="Quitar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
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
                  placeholder="EJ: Se necesita para mantenimiento programado…"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={createDispatchRequest.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createDispatchRequest.isPending} className="min-w-[120px]">
            {createDispatchRequest.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Crear Despacho'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
