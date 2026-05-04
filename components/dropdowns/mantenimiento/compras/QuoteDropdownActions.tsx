import { useUpdateQuoteStatus } from "@/actions/mantenimiento/compras/cotizaciones/actions";
import { useUpdateRequisitionStatus } from "@/actions/mantenimiento/compras/requisiciones/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyStore } from "@/stores/CompanyStore";
import { Quote } from "@/types";
import {
  ClipboardCheck,
  ClipboardX,
  EyeIcon,
  Loader2,
  MoreHorizontal
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../../../ui/dialog";
import { useCreatePurchaseOrder } from "@/actions/mantenimiento/compras/ordenes_compras/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const QuoteDropdownActions = ({ quote }: { quote: Quote }) => {
  const { user } = useAuth();
  const { selectedCompany } = useCompanyStore();

  const [openReject, setOpenReject] = useState(false);
  const [openApprove, setOpenApprove] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Group articles by vendor for multi-vendor PO creation
  const vendorGroups = useMemo(() => {
    const articles = quote.article_quote_order ?? [];
    const groups: Record<string, { vendorId: number; vendorName: string; articles: typeof articles }> = {};

    for (const article of articles) {
      const vendorId = article.vendor_id ?? quote.vendor?.id;
      if (!vendorId) continue;
      const key = String(vendorId);
      if (!groups[key]) {
        groups[key] = {
          vendorId: Number(vendorId),
          vendorName: article.vendor?.name ?? quote.vendor?.name ?? 'N/A',
          articles: [],
        };
      }
      groups[key].articles.push(article);
    }
    return Object.values(groups);
  }, [quote]);

  const hasMultipleVendors = vendorGroups.length > 1;

  const { updateStatusQuote } = useUpdateQuoteStatus();
  const { updateStatusRequisition } = useUpdateRequisitionStatus();
  const { createPurchaseOrder } = useCreatePurchaseOrder();

  const isLoading =
    updateStatusQuote.isPending ||
    updateStatusRequisition.isPending ||
    createPurchaseOrder.isPending;

  // ✅ RECHAZAR
  const handleReject = async (id: number) => {
    try {
      const data = {
        status: "RECHAZADA",
        updated_by: `${user?.first_name} ${user?.last_name}`,
        company: selectedCompany!.slug
      };

      await updateStatusQuote.mutateAsync({
        id,
        data,
        company: selectedCompany!.slug
      });

      await updateStatusRequisition.mutateAsync({
        id: quote.requisition_order.id,
        data: {
          status: "PROCESO",
          updated_by: `${user?.first_name} ${user?.last_name}`
        },
        company: selectedCompany!.slug
      });

      setOpenReject(false);
    } catch (error) {
      console.error("Error rechazando cotización:", error);
    }
  };

  // ✅ APROBAR (flujo seguro — crea una PO por cada proveedor distinto)
  const handleApprove = async (id: number) => {
    if (!orderNumber.trim()) return;

    try {
      // 1️⃣ Crear una PO por cada grupo de proveedor
      for (let i = 0; i < vendorGroups.length; i++) {
        const group = vendorGroups[i];
        const groupTotal = group.articles.reduce(
          (sum, a) => sum + (a.quantity * Number(a.unit_price)),
          0
        );
        const poOrderNumber = vendorGroups.length > 1
          ? `${orderNumber}-${i + 1}`
          : orderNumber;

        const poData = {
          status: "PROCESO",
          order_number: poOrderNumber,
          justification: quote.justification,
          purchase_date: new Date(),
          sub_total: groupTotal,
          total: groupTotal,
          vendor_id: group.vendorId,
          created_by: `${user?.first_name} ${user?.last_name}`,
          articles_purchase_orders: group.articles,
          quote_order_id: Number(quote.id)
        };

        await createPurchaseOrder.mutateAsync({
          data: poData,
          company: selectedCompany!.slug
        });
      }

      // 2️⃣ Actualizar cotización
      await updateStatusQuote.mutateAsync({
        id,
        data: {
          status: "APROBADO",
          updated_by: `${user?.first_name} ${user?.last_name}`,
        },
        company: selectedCompany!.slug
      });

      // 3️⃣ Actualizar requisición
      await updateStatusRequisition.mutateAsync({
        id: quote.requisition_order.id,
        data: {
          status: "APROBADO",
          updated_by: `${user?.first_name} ${user?.last_name}`
        },
        company: selectedCompany!.slug
      });

      setOpenApprove(false);
      setOrderNumber("");
    } catch (error) {
      console.error("Error aprobando cotización:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center" className="flex flex-col gap-1">
          {quote.status !== "APROBADO" && quote.status !== "RECHAZADA" && (
            <>
              <DropdownMenuItem onClick={() => setOpenApprove(true)}>
                <ClipboardCheck className="size-5 text-green-500 mr-2" />
                Aprobar
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setOpenReject(true)}>
                <ClipboardX className="size-5 text-red-500 mr-2" />
                Rechazar
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuItem>
            <EyeIcon className="size-5 mr-2" />
            Ver detalle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ❌ RECHAZAR */}
      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              ¿Seguro que desea rechazar la cotización?
            </DialogTitle>
            <DialogDescription className="text-center">
              Esta acción es irreversible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenReject(false)}
            >
              Cancelar
            </Button>

            <Button
              disabled={isLoading}
              onClick={() => handleReject(Number(quote.id))}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ APROBAR */}
      <Dialog open={openApprove} onOpenChange={setOpenApprove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              ¿Seguro que desea aprobar la cotización?
            </DialogTitle>
            <DialogDescription className="text-center">
              {hasMultipleVendors
                ? `Se generarán ${vendorGroups.length} órdenes de compra (una por cada proveedor). ¿Continuar?`
                : 'Se aprobará la cotización y se generará una Orden de Compra.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 mt-2">
            <Label>Nro. de PO / OC:</Label>
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Ej: PO-2026-001"
            />
            {!orderNumber && (
              <span className="text-xs text-red-500">
                El número de orden es obligatorio
              </span>
            )}
          </div>

          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setOpenApprove(false)}
            >
              Cancelar
            </Button>

            <Button
              disabled={!orderNumber.trim() || isLoading}
              onClick={() => handleApprove(Number(quote.id))}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuoteDropdownActions;