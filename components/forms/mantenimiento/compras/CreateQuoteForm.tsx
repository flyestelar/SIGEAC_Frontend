'use client';
import { useCreateQuote } from '@/actions/mantenimiento/compras/cotizaciones/actions';
import { useUpdateRequisitionStatus } from '@/actions/mantenimiento/compras/requisiciones/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useGetVendors } from '@/hooks/general/proveedores/useGetVendors';
import { useGetSecondaryUnits } from '@/hooks/general/unidades/useGetSecondaryUnits';
import { useGetLocationsByCompanyId } from '@/hooks/sistema/useGetLocationsByCompanyId';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Requisition } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { AmountInput } from '../../../misc/AmountInput';
import { Calendar } from '../../../ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/popover';
import { ScrollArea } from '../../../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import CreateVendorForm from '../../general/CreateVendorForm';

const FormSchema = z.object({
  justification: z.string({ message: 'Debe ingresar una justificacion.' }),
  articles: z.array(
    z.object({
      part_number: z.string(),
      quantity: z.number().min(1, { message: 'Debe ingresar al menos 1.' }),
      unit_price: z.string().min(0, { message: 'El precio no puede ser negativo.' }),
      condition: z.string({ message: 'Debe elegir la condición.' }),
    }),
  ),
  vendor_id: z.string({ message: 'Debe seleccionar un proveedor.' }),
  quote_date: z.date({ message: 'Debe ingresar una fecha de cotizacion.' }),
});

type FormSchemaType = z.infer<typeof FormSchema>;

export function CreateQuoteForm({
  initialData,
  onClose,
  req,
}: {
  initialData?: any;
  onClose: () => void;
  req: Requisition;
}) {
  const { selectedCompany } = useCompanyStore();

  const [openVendor, setOpenVendor] = useState(false);
  const [openVendorDialog, setOpenVendorDialog] = useState(false);

  const { updateStatusRequisition } = useUpdateRequisitionStatus();
  const { data: secondaryUnits } = useGetSecondaryUnits();
  const { createQuote } = useCreateQuote();
  const { user } = useAuth();

  const transformedArticles =
    initialData?.articles?.flatMap((article: any) =>
      article.batch_articles.map((batchArticle: any) => ({
        part_number: batchArticle.part_number,
        quantity: batchArticle.quantity,
        unit: batchArticle.unit ? batchArticle.unit.id.toString() : undefined,
        unit_price: '',
        condition: '',
        image: batchArticle.image,
      })),
    ) || [];

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      justification: initialData?.justification || '',
      articles: transformedArticles,
    },
  });

  const { control, handleSubmit } = form;

  const { fields } = useFieldArray({ control, name: 'articles' });

  const calculateTotal = (articles: FormSchemaType['articles']) =>
    articles.reduce((sum, article) => sum + (article.quantity * Number(article.unit_price) || 0), 0);

  const articles = useWatch({ control, name: 'articles' });
  const total = useMemo(() => calculateTotal(articles), [articles]);

  const { data: vendors, isLoading: isVendorsLoading, isError: isVendorsErros } = useGetVendors(selectedCompany?.slug);


  const onSubmit = async (data: FormSchemaType) => {
    const formattedData = {
      ...data,
      created_by: `${user?.id}`,
      sub_total: total,
      total: total,
      company: selectedCompany!.slug,
      requisition_order_id: req.id,
      vendor_id: Number(data.vendor_id),
      articles: data.articles.map((article) => ({
        ...article,
        quantity: article.quantity,
        amount: Number(article.unit_price) * Number(article.quantity),
      })),
    };
    await createQuote.mutateAsync({ data: formattedData, company: selectedCompany!.slug });
    await updateStatusRequisition.mutateAsync({
      id: req.id,
      data: {
        status: 'COTIZADO',
        updated_by: `${user?.first_name} ${user?.last_name}`,
      },
      company: selectedCompany!.slug,
    });
    onClose();
  };

  const fieldLabel = 'text-[11px] font-semibold uppercase tracking-widest text-muted-foreground';

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Cabecera: fecha · proveedor · destino */}
        <div className="grid grid-cols-3 gap-4">
          {/* Fecha */}
          <FormField
            control={form.control}
            name="quote_date"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1.5">
                <p className={fieldLabel}>Fecha de Cotización</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {field.value ? format(field.value, 'PPP', { locale: es }) : 'Seleccione la fecha'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={es}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Proveedor */}
          <FormField
            control={form.control}
            name="vendor_id"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1.5">
                <p className={fieldLabel}>Proveedor</p>
                <Popover open={openVendor} onOpenChange={setOpenVendor}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        disabled={isVendorsLoading}
                        variant="outline"
                        role="combobox"
                        className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                      >
                        {isVendorsLoading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : field.value ? (
                          vendors?.find((v) => v.id.toString() === field.value)?.name
                        ) : (
                          'Elige al proveedor...'
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Busque un proveedor..." />
                      <CommandList>
                        <CommandEmpty>No se ha encontrado un proveedor.</CommandEmpty>
                        <CommandGroup>
                          <Dialog open={openVendorDialog} onOpenChange={setOpenVendorDialog}>
                            <DialogTrigger asChild>
                              <div className="flex justify-center p-1">
                                <Button
                                  variant="ghost"
                                  className="w-full h-8 text-xs"
                                  onClick={() => setOpenVendorDialog(true)}
                                >
                                  + Crear Proveedor
                                </Button>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[490px]">
                              <DialogHeader>
                                <DialogTitle>Creación de Proveedor</DialogTitle>
                                <DialogDescription>
                                  Cree un proveedor rellenando la información necesaria.
                                </DialogDescription>
                              </DialogHeader>
                              <CreateVendorForm onClose={() => setOpenVendorDialog(false)} />
                            </DialogContent>
                          </Dialog>
                          {vendors?.map((vendor) => (
                            <CommandItem
                              value={vendor.name}
                              key={vendor.id.toString()}
                              onSelect={() => {
                                form.setValue('vendor_id', vendor.id.toString());
                                setOpenVendor(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  vendor.id.toString() === field.value ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {vendor.name}
                            </CommandItem>
                          ))}
                          {isVendorsErros && (
                            <p className="p-2 text-xs text-muted-foreground">
                              Ha ocurrido un error al cargar los datos...
                            </p>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Justificación */}
        <FormField
          control={control}
          name="justification"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <p className={fieldLabel}>Justificación</p>
              <FormControl>
                <Textarea
                  placeholder="Ej: Necesidad de la pieza X para instalación..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Artículos */}
        <div className="overflow-hidden rounded-lg border bg-background">
          {/* Header de sección */}
          <div className="flex items-center justify-between border-b bg-muted/20 px-5 py-3">
            <span className={fieldLabel}>Artículos</span>
            <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
              {fields.length} {fields.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>

          {/* Cabecera de columnas */}
          <div className="grid grid-cols-[minmax(0,1.5fr)_64px_84px_148px_108px] gap-3 border-b bg-muted/10 px-5 py-2">
            {(['# Parte', 'Cant.', 'Condición', 'Precio Unit.', 'Total'] as const).map((col, i) => (
              <span key={col} className={cn(fieldLabel, i === 4 && 'text-right')}>
                {col}
              </span>
            ))}
          </div>

          {/* Filas */}
          <ScrollArea className={cn(fields.length > 4 && 'h-[260px]')}>
            <div className="divide-y">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[minmax(0,1.5fr)_64px_84px_132px_108px] items-center gap-3 px-5 py-3"
                >
                  {/* P/N */}
                  <FormField
                    control={control}
                    name={`articles.${index}.part_number`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input
                            disabled
                            className="disabled:opacity-90 disabled:cursor-default h-8 font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Cantidad */}
                  <FormField
                    control={control}
                    name={`articles.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input
                            disabled
                            className="disabled:opacity-90 disabled:cursor-default h-8 text-center text-sm font-semibold"
                            type="number"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Condición */}
                  <FormField
                    control={control}
                    name={`articles.${index}.condition`}
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger aria-invalid={fieldState.invalid} className="min-w-[120px]">
                              <SelectValue placeholder="Selec..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OH">OH</SelectItem>
                              <SelectItem value="SV">SV</SelectItem>
                              <SelectItem value="NE">NE</SelectItem>
                              <SelectItem value="NS">NS</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Precio Unitario */}
                  <FormField
                    control={control}
                    name={`articles.${index}.unit_price`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <AmountInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Total por artículo */}
                  <p className="text-right text-sm font-semibold tabular-nums">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                    }).format((articles[index]?.quantity || 0) * (Number(articles[index]?.unit_price) || 0))}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Total general */}
          <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
            <span className={fieldLabel}>Total General</span>
            <span className="text-base font-bold tabular-nums">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
              }).format(total)}
            </span>
          </div>
        </div>

        {/* Enviar */}
        <Button disabled={createQuote.isPending || updateStatusRequisition.isPending} type="submit" className="w-full">
          {createQuote.isPending || updateStatusRequisition.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : null}
          {createQuote.isPending || updateStatusRequisition.isPending ? 'Procesando...' : 'Crear Cotización'}
        </Button>
      </form>
    </Form>
  );
}
