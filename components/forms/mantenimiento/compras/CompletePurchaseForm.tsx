'use client';

import { useCompletePurchase } from '@/actions/mantenimiento/compras/ordenes_compras/actions';
import { AmountInput } from '@/components/misc/AmountInput';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyStore } from '@/stores/CompanyStore';
import { PurchaseOrder } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Package2, ReceiptText } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useWatch } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const fieldLabelClass = 'text-[11px] font-semibold uppercase tracking-widest text-muted-foreground';

const articleSchema = z.object({
  article_part_number: z.string(),
  article_purchase_order_id: z.number(),
});

const formSchema = z.object({
  freight: z.string().optional(),
  hazmat: z.string().optional(),
  invoice: z.instanceof(File).optional(),
  status: z.enum(['PAGADO', 'CREDITO']),
  articles_purchase_orders: z.array(articleSchema),
});

type FormSchemaType = z.infer<typeof formSchema>;

interface FormProps {
  onClose: () => void;
  po: PurchaseOrder;
}

const toMonetary = (value?: string) => value?.trim() || '0';

const parseAmount = (value?: string) => Number(value || 0);

export function CompletePurchaseForm({ onClose, po }: FormProps) {
  const { selectedCompany } = useCompanyStore();
  const { user } = useAuth();
  const { completePurchase } = useCompletePurchase();

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      freight: '',
      hazmat: '',
      invoice: undefined,
      status: 'CREDITO' as const,
      articles_purchase_orders: po.article_purchase_order.map((article) => ({
        article_part_number: article.article_part_number,
        article_purchase_order_id: article.id,
      })),
    },
  });

  const [freight = '', hazmat = ''] = useWatch({
    control: form.control,
    name: ['freight', 'hazmat'],
  });

  const total = Number(po.sub_total) + parseAmount(freight) + parseAmount(hazmat);

  const onSubmit = async (data: FormSchemaType) => {
    await completePurchase.mutateAsync({
      id: po.id,
      company: selectedCompany!.slug,
      data: {
        freight: toMonetary(data.freight),
        hazmat: toMonetary(data.hazmat),
        total,
        updated_by: `${user?.first_name} ${user?.last_name}`,
        company: selectedCompany!.slug,
        invoice: data.invoice,
        status: data.status,
        articles_purchase_orders: data.articles_purchase_orders,
      },
    });

    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <section className="overflow-hidden rounded-lg border bg-background">
          <div className="border-b px-5 py-3">
            <p className={fieldLabelClass}>Resumen de la Orden</p>
          </div>
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <p className={fieldLabelClass}>PO</p>
              <p className="text-sm font-medium">{po.order_number}</p>
            </div>
            <div className="space-y-1.5">
              <p className={fieldLabelClass}>Articulos</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package2 className="h-4 w-4 text-muted-foreground" />
                <span>{po.article_purchase_order.length}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className={fieldLabelClass}>Subtotal</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <ReceiptText className="h-4 w-4 text-muted-foreground" />
                <span>{moneyFormatter.format(Number(po.sub_total))}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border bg-background">
          <div className="border-b px-5 py-3">
            <p className={fieldLabelClass}>Articulos de la PO</p>
          </div>
          <ScrollArea className={po.article_purchase_order.length > 4 ? 'h-[260px]' : ''}>
            <div className="divide-y">
              {po.article_purchase_order.map((article) => (
                <div
                  key={article.id}
                  className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1.5fr)_auto_auto]"
                >
                  <div className="space-y-1.5">
                    <p className={fieldLabelClass}>Part Number</p>
                    <p className="font-mono text-sm font-medium">{article.article_part_number}</p>
                    {article.article_alt_part_number && (
                      <p className="font-mono text-xs text-muted-foreground">
                        ALT: {article.article_alt_part_number}
                      </p>
                    )}
                    {article.batch?.name && (
                      <p className="text-xs text-muted-foreground">{article.batch.name}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className={fieldLabelClass}>Cantidad</p>
                    <p className="text-sm font-medium">{article.quantity}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className={fieldLabelClass}>Monto</p>
                    <p className="text-sm font-medium">
                      {moneyFormatter.format(Number(article.unit_price) * Number(article.quantity))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </section>

        <section className="overflow-hidden rounded-lg border bg-background">
          <div className="border-b px-5 py-3">
            <p className={fieldLabelClass}>Costos Finales</p>
          </div>
          <div className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="freight"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className={fieldLabelClass}>freight</FormLabel>
                    <FormControl>
                      <AmountInput placeholder="$0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hazmat"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className={fieldLabelClass}>Hazmat</FormLabel>
                    <FormControl>
                      <AmountInput placeholder="$0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="invoice"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className={fieldLabelClass}>Invoice</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="file"
                      accept="image/*,.pdf"
                      className="cursor-pointer"
                      onChange={(event) => onChange(event.target.files?.[0] ?? undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border bg-muted/20 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{moneyFormatter.format(Number(po.sub_total))}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total final</span>
                <span className="text-base font-semibold">{moneyFormatter.format(total)}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className={fieldLabelClass}>Tipo de pago</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="PAGADO" id="status-pagado" />
                        <Label htmlFor="status-pagado" className="cursor-pointer text-sm">Pagado</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="CREDITO" id="status-credito" />
                        <Label htmlFor="status-credito" className="cursor-pointer text-sm">Crédito</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button disabled={completePurchase.isPending} type="submit">
                {completePurchase.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Confirmar Compra'}
              </Button>
            </div>
          </div>
        </section>
      </form>
    </Form>
  );
}
