"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FollowUpControl } from "@/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useCompanyStore } from "@/stores/CompanyStore";
import { Button } from "@/components/ui/button";
import { CalendarDays, ClipboardList } from "lucide-react";

interface FollowUpControlDialogProps {
  followUpControls: FollowUpControl[];
  planId: string | number;
  measureId: string | number;
  triggerElement?: React.ReactNode;
  showTrigger?: boolean;
}

const FollowUpControlDialog = ({
  followUpControls,
  planId,
  measureId,
  triggerElement,
  showTrigger = true,
}: FollowUpControlDialogProps) => {
  const { selectedCompany } = useCompanyStore();

  const getNormalizedDate = (dateInput: any) => {
    const parsedDate = parseISO(String(dateInput as unknown));
    return new Date(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate());
  };

  const controlsList = (
    <div className="flex flex-col gap-2">
      {followUpControls.length > 0 ? (
        followUpControls.map((control, index) => (
          <div
            key={control.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Control {index + 1}
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug">
              {control.description}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
              {format(getNormalizedDate(control.date), "PPP", { locale: es })}
            </p>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
          <ClipboardList className="w-8 h-8 opacity-40" />
          <p className="text-sm">No hay controles registrados</p>
        </div>
      )}
    </div>
  );

  const dialogContentClass =
    "flex flex-col w-[calc(100vw-1rem)] sm:max-w-md max-h-[85dvh] rounded-2xl p-4 sm:p-6 gap-0";

  const sharedContent = (
    <>
      <DialogHeader className="pb-3 border-b border-border">
        <DialogTitle className="text-base flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          Controles de Seguimiento
        </DialogTitle>
        <DialogDescription>
          {followUpControls.length > 0
            ? `${followUpControls.length} control${followUpControls.length !== 1 ? "es" : ""} registrado${followUpControls.length !== 1 ? "s" : ""}`
            : "Sin controles registrados aún"}
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2 min-h-0">
        {controlsList}
      </div>

      <div className="pt-3 border-t border-border">
        <Link
          href={`/${selectedCompany?.slug}/sms/gestion_reportes/planes_de_mitigacion/${planId}/medidas/${measureId}/controles_de_seguimiento`}
        >
          <Button variant="outline" className="w-full rounded-xl">
            Ver todos los controles
          </Button>
        </Link>
      </div>
    </>
  );

  if (!showTrigger) {
    return (
      <DialogContent className={dialogContentClass}>
        {sharedContent}
      </DialogContent>
    );
  }

  const defaultTrigger = (
    <Badge className="flex items-center gap-1.5 h-8 px-3 bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 rounded-full cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
      {followUpControls.length > 0 ? (
        <>
          <ClipboardList className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">
            {followUpControls.length} control{followUpControls.length !== 1 ? "es" : ""}
          </span>
        </>
      ) : (
        <span className="text-xs font-semibold">Sin control</span>
      )}
    </Badge>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{triggerElement || defaultTrigger}</DialogTrigger>
      <DialogContent className={dialogContentClass}>
        {sharedContent}
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpControlDialog;