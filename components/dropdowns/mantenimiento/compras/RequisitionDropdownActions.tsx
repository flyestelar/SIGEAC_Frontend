import {
  useDeleteRequisition,
  useUpdateRequisitionStatus,
} from '@/actions/mantenimiento/compras/requisiciones/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Requisition } from '@/types';
import { cn } from '@/lib/utils';
import { ClipboardCheck, ClipboardX, Loader2, MoreHorizontal, Trash2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { CreateQuoteForm } from '../../../forms/mantenimiento/compras/CreateQuoteForm';
import { Button } from '../../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/dialog';
import { Textarea } from '../../../ui/textarea';
import LoadingPage from '../../../misc/LoadingPage';

function transformApiData(apiData: any) {
  return {
    order_number: apiData.order_number,
    justification: apiData.justification,
    company: '',
    created_by: apiData.created_by.id.toString(),
    tax: '0',
    requested_by: apiData.requested_by,
    articles: apiData.batch.map((batch: any) => ({
      batch: batch.id.toString(),
      batch_name: batch.name,
      batch_articles: batch.batch_articles.map((article: any) => ({
        part_number: article.article_part_number || article.article_alt_part_number || article.pma,
        alternate_part_number: article.article_alt_part_number || '',
        unit: article.unit,
        quantity: parseFloat(article.quantity),
        image: article.image || null,
      })),
    })),
  };
}

const STATUS = {
  PROCESO: 'PROCESO',
  COTIZADO: 'COTIZADO',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO',
} as const;

const MIN_OBSERVATION_LENGTH = 10;

const RequisitionsDropdownActions = ({ req }: { req: Requisition }) => {
  const { user } = useAuth();

  const [open, setOpen] = useState<boolean>(false);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const [openReject, setOpenReject] = useState<boolean>(false);
  const [observation, setObservation] = useState<string>('');

  const { deleteRequisition } = useDeleteRequisition();
  const { updateStatusRequisition } = useUpdateRequisitionStatus();
  const { selectedCompany } = useCompanyStore();
  const userRoles = user?.roles?.map((role) => role.name) || [];
  const initialData = transformApiData(req);

  if (!selectedCompany) return <LoadingPage />;

  const status = req.status?.toUpperCase().trim();
  const isPrivileged =
    userRoles.includes('ANALISTA_COMPRAS') ||
    userRoles.includes('SUPERUSER') ||
    userRoles.includes('JEFE_COMPRAS');

  const canQuote = isPrivileged && status === STATUS.PROCESO;
  const canReject = isPrivileged && status !== STATUS.APROBADO && status !== STATUS.RECHAZADO;
  const canDelete = status !== STATUS.APROBADO;

  const observationTrimmed = observation.trim();
  const charCount = observationTrimmed.length;
  const isObservationValid = charCount >= MIN_OBSERVATION_LENGTH;

  const handleDelete = async () => {
    await deleteRequisition.mutateAsync({ id: req.id, company: selectedCompany.slug });
    setOpenDelete(false);
  };

  const handleReject = async () => {
    await updateStatusRequisition.mutateAsync({
      id: req.id,
      data: {
        status: STATUS.RECHAZADO,
        updated_by: `${user?.first_name} ${user?.last_name}`,
        observation: observationTrimmed,
      },
      company: selectedCompany.slug,
    });
    setObservation('');
    setOpenReject(false);
  };

  const handleOpenReject = () => {
    setObservation('');
    setOpen(false);
    setOpenReject(true);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="flex gap-2 justify-center">
          {canQuote && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => { setOpen(false); setOpenConfirm(true); }}
            >
              <ClipboardCheck className="size-5 text-green-600" />
            </DropdownMenuItem>
          )}
          {canReject && (
            <DropdownMenuItem className="cursor-pointer" onClick={handleOpenReject}>
              <ClipboardX className="size-5 text-orange-500" />
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => { setOpen(false); setOpenDelete(true); }}
            >
              <Trash2 className="size-5 text-red-500" />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Eliminar ─────────────────────────────────────────────────── */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-3xl">¿Eliminar Requisición?</DialogTitle>
            <p className="text-center text-sm text-muted-foreground">
              Esta acción no se puede deshacer. ¿Estás seguro de eliminar esta requisición?
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="destructive" onClick={() => setOpenDelete(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleteRequisition.isPending} className="bg-primary text-white">
              {deleteRequisition.isPending ? <Loader2 className="animate-spin size-4" /> : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Generar Cotización ───────────────────────────────────────── */}
      <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0">
          <div className="border-b border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/10">
                <ClipboardCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold leading-tight">
                  Generar Cotización
                </DialogTitle>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {req.order_number}
                </p>
              </div>
            </div>
          </div>
          <CreateQuoteForm req={req} initialData={initialData} onClose={() => setOpenConfirm(false)} />
        </DialogContent>
      </Dialog>

      {/* ── Rechazar ─────────────────────────────────────────────────── */}
      <Dialog
        open={openReject}
        onOpenChange={(v) => {
          if (!v) setObservation('');
          setOpenReject(v);
        }}
      >
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          {/* Header strip */}
          <div className="border-b border-red-500/20 bg-red-500/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-red-500/30 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold leading-tight">
                  Rechazar Requisición
                </DialogTitle>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {req.order_number}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-3 px-5 py-4">
            <p className="text-xs text-muted-foreground">
              Esta acción cambiará el estado de la requisición a{' '}
              <span className="font-semibold text-red-600 dark:text-red-400">RECHAZADO</span>.
              El motivo quedará registrado en la requisición.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Motivo de rechazo
              </label>
              <Textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Describa la razón por la cual se rechaza esta requisición…"
                className={cn(
                  'min-h-[96px] resize-none bg-muted/30 text-sm transition-colors',
                  !isObservationValid && charCount > 0
                    ? 'border-amber-500/60 focus-visible:ring-amber-500/30'
                    : '',
                )}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-[11px] transition-colors',
                    charCount === 0
                      ? 'text-muted-foreground'
                      : isObservationValid
                        ? 'text-muted-foreground'
                        : 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  {!isObservationValid && charCount > 0
                    ? `${MIN_OBSERVATION_LENGTH - charCount} caracteres más requeridos`
                    : `Mínimo ${MIN_OBSERVATION_LENGTH} caracteres`}
                </span>
                <span
                  className={cn(
                    'font-mono text-[11px] tabular-nums',
                    isObservationValid ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  {charCount}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setObservation(''); setOpenReject(false); }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={!isObservationValid || updateStatusRequisition.isPending}
            >
              {updateStatusRequisition.isPending ? (
                <>
                  <Loader2 className="mr-2 animate-spin size-3.5" />
                  Rechazando…
                </>
              ) : (
                'Rechazar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequisitionsDropdownActions;
