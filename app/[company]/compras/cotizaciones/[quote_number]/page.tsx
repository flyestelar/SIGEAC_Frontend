'use client';

import { useDeleteQuote } from '@/actions/mantenimiento/compras/cotizaciones/actions';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useGetQuoteByQuoteNumber } from '@/hooks/mantenimiento/compras/useGetQuoteByQuoteNumber';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { PurchaseOrder } from '@/types';
import { CheckCircle2, Loader2, Package, ShoppingCart, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const QuotePage = () => {
  const [openDelete, setOpenDelete] = useState<boolean>(false);

  const { selectedCompany } = useCompanyStore();
  const router = useRouter();
  const { quote_number } = useParams<{ quote_number: string }>();

  const { data, isLoading } = useGetQuoteByQuoteNumber(selectedCompany?.slug ?? null, quote_number);
  const { deleteQuote } = useDeleteQuote();

  // Compute unique vendors from article-level data
  const uniqueVendors = useMemo(() => {
    if (!data?.article_quote_order) return [];
    const seen = new Map<number | string, string>();
    for (const article of data.article_quote_order) {
      if (article.vendor?.id && article.vendor?.name) {
        seen.set(article.vendor.id, article.vendor.name);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [data?.article_quote_order]);

  const hasMultipleVendors = uniqueVendors.length > 1;

  // Group purchase orders by vendor if the quote has them
  const purchaseOrdersByVendor = useMemo(() => {
    const pos = (data as any)?.purchase_orders as PurchaseOrder[] | undefined;
    if (!pos || pos.length === 0) return null;
    const grouped: Record<string, { vendor: { id: string | number; name: string }; orders: PurchaseOrder[] }> = {};
    for (const po of pos) {
      const key = String(po.vendor?.id ?? 'unknown');
      if (!grouped[key]) {
        grouped[key] = { vendor: po.vendor, orders: [] };
      }
      grouped[key].orders.push(po);
    }
    return Object.values(grouped);
  }, [data]);

  if (isLoading) return <LoadingPage />;

  const isApproved = data?.status.toLowerCase() === 'aprobado' || data?.status.toLowerCase() === 'aprobada';

  const totalAmount =
    data?.article_quote_order.reduce((sum, a) => sum + a.quantity * Number(a.unit_price), 0) ?? 0;

  const statusCfg = isApproved
    ? { label: 'APROBADO', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
    : { label: 'PENDIENTE', className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' };

  const handleDelete = async (id: number) => {
    await deleteQuote.mutateAsync({ id, company: selectedCompany!.slug });
    router.push(`/${selectedCompany!.slug}/general/cotizaciones`);
  };

  return (
    <ContentLayout title='Cotizacion'>
      <div className='mx-auto max-w-7xl space-y-4'>

        {/* -- Header -- */}
        <div className='rounded-lg border bg-background'>
          <div className='flex items-center justify-between px-5 py-4'>
            <div className='flex items-center gap-4'>
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  Cotizacion
                </p>
                <p className='font-mono text-2xl font-bold tracking-tight'>#{quote_number}</p>
              </div>
              <Badge
                variant='outline'
                className={cn('px-2.5 py-1 text-xs font-semibold uppercase tracking-wider', statusCfg.className)}
              >
                {statusCfg.label}
              </Badge>
            </div>

            {!isApproved && (
              <div className='flex items-center gap-2'>
                <Button size='sm' className='gap-2'>
                  <CheckCircle2 className='h-4 w-4' />
                  Aprobar
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setOpenDelete(true)}
                  className='gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive'
                >
                  <Trash2 className='h-4 w-4' />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* -- Body Grid -- */}
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>

          {/* Left -- details + line items */}
          <div className='space-y-4 lg:col-span-8'>

            {/* Details */}
            <div className='rounded-lg border bg-background'>
              <div className='border-b px-5 py-3'>
                <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  Detalles
                </p>
              </div>
              <div className='space-y-5 p-5'>
                <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
                  <div className='space-y-1.5'>
                    <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                      Creado Por
                    </p>
                    <p className='text-sm font-medium'>{data?.created_by}</p>
                  </div>
                  {data?.vendor && (
                    <div className='space-y-1.5'>
                      <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                        Proveedor por defecto
                      </p>
                      <p className='text-sm font-medium'>{data.vendor.name}</p>
                    </div>
                  )}
                </div>

                {hasMultipleVendors && (
                  <>
                    <Separator />
                    <div className='space-y-1.5'>
                      <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                        Proveedores ({uniqueVendors.length})
                      </p>
                      <div className='flex flex-wrap gap-1.5'>
                        {uniqueVendors.map((v) => (
                          <Badge
                            key={v.id}
                            variant='outline'
                            className='text-xs font-medium'
                          >
                            {v.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {data?.justification && (
                  <>
                    <Separator />
                    <div className='space-y-1.5'>
                      <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                        Justificacion
                      </p>
                      <p className='text-sm leading-relaxed text-foreground/80'>{data.justification}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className='overflow-hidden rounded-lg border bg-background'>
              <div className='flex items-center gap-2 border-b bg-muted/20 px-5 py-3'>
                <Package className='h-3.5 w-3.5 text-muted-foreground' />
                <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  Articulos — {data?.article_quote_order.length ?? 0} items
                </p>
              </div>

              {/* Column headers */}
              <div className='grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-6 bg-muted/10 px-5 py-2.5'>
                <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  Articulo / P/N
                </p>
                <p className='w-32 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  Proveedor
                </p>
                <p className='w-16 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  Cant.
                </p>
                <p className='w-28 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  P. Unit.
                </p>
                <p className='w-28 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  Total
                </p>
              </div>

              <div className='divide-y'>
                {data?.article_quote_order.map((article) => (
                  <div
                    key={article.article_part_number}
                    className='grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-6 px-5 py-4'
                  >
                    <div>
                      <p className='text-sm font-medium'>{article.batch?.name ?? article.article_part_number}</p>
                      <p className='mt-0.5 font-mono text-xs text-muted-foreground'>
                        {article.article_part_number}
                      </p>
                    </div>
                    <p className='w-32 text-sm text-foreground/80 truncate'>
                      {article.vendor?.name ?? data?.vendor?.name ?? 'N/A'}
                    </p>
                    <p className='w-16 text-right text-sm font-medium'>{article.quantity}</p>
                    <p className='w-28 text-right font-mono text-sm'>
                      ${Number(article.unit_price).toFixed(2)}
                    </p>
                    <p className='w-28 text-right font-mono text-sm font-semibold'>
                      ${(article.quantity * Number(article.unit_price)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total row */}
              <div className='flex items-center justify-end gap-6 border-t bg-muted/10 px-5 py-3'>
                <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  Total
                </p>
                <p className='font-mono text-base font-bold'>${totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Purchase Orders grouped by vendor (only shown if approved and POs exist) */}
            {isApproved && purchaseOrdersByVendor && purchaseOrdersByVendor.length > 0 && (
              <div className='overflow-hidden rounded-lg border bg-background'>
                <div className='flex items-center gap-2 border-b bg-muted/20 px-5 py-3'>
                  <ShoppingCart className='h-3.5 w-3.5 text-muted-foreground' />
                  <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                    Ordenes de Compra Generadas
                  </p>
                </div>

                <div className='divide-y'>
                  {purchaseOrdersByVendor.map((group) => (
                    <div key={String(group.vendor?.id)} className='p-5 space-y-3'>
                      <div className='flex items-center gap-2'>
                        <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                          Proveedor
                        </p>
                        <Badge variant='outline' className='text-xs font-medium'>
                          {group.vendor?.name ?? 'N/A'}
                        </Badge>
                      </div>
                      <div className='space-y-2'>
                        {group.orders.map((po) => (
                          <div
                            key={po.id}
                            className='flex items-center justify-between rounded-md border bg-muted/5 px-4 py-3'
                          >
                            <div>
                              <p className='font-mono text-sm font-semibold'>{po.order_number}</p>
                              <p className='text-xs text-muted-foreground'>
                                {po.article_purchase_order?.length ?? 0} articulo(s)
                              </p>
                            </div>
                            <p className='font-mono text-sm font-bold'>${Number(po.total).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right -- summary */}
          <div className='lg:col-span-4 lg:sticky lg:top-4 self-start'>
            <div className='rounded-lg border bg-background'>
              <div className='border-b px-5 py-3'>
                <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  Resumen
                </p>
              </div>
              <div className='space-y-4 p-5'>
                <div className='space-y-1.5'>
                  <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                    Nro. Cotizacion
                  </p>
                  <p className='font-mono text-sm font-medium'>#{quote_number}</p>
                </div>
                <Separator />
                <div className='space-y-1.5'>
                  <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                    Items
                  </p>
                  <p className='text-sm font-medium'>{data?.article_quote_order.length ?? 0}</p>
                </div>
                <Separator />
                {uniqueVendors.length > 0 && (
                  <>
                    <div className='space-y-1.5'>
                      <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                        Proveedores
                      </p>
                      <p className='text-sm font-medium'>{uniqueVendors.length}</p>
                    </div>
                    <Separator />
                  </>
                )}
                <div className='space-y-1.5'>
                  <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                    Monto Total
                  </p>
                  <p className='font-mono text-xl font-bold'>${totalAmount.toFixed(2)}</p>
                </div>
                <Separator />
                <div className='space-y-1.5'>
                  <p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                    Estado
                  </p>
                  <Badge
                    variant='outline'
                    className={cn('text-xs font-semibold uppercase tracking-wider', statusCfg.className)}
                  >
                    {statusCfg.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -- Delete Dialog -- */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-xl'>Eliminar Cotizacion #{quote_number}?</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>Esta accion no se puede deshacer.</p>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpenDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant='destructive'
              onClick={() => handleDelete(data!.id)}
              disabled={deleteQuote.isPending}
            >
              {deleteQuote.isPending ? <Loader2 className='size-4 animate-spin' /> : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContentLayout>
  );
};

export default QuotePage;
