"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import CreateFollowUpControlForm from "@/components/forms/sms/CreateFollowUpControlForm";
import { useParams } from "next/navigation";

export default function CreateFollowUpControlDialog() {
  const { plan_id, medida_id } = useParams<{
    plan_id: string;
    medida_id: string;
  }>();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size="sm"
          className="h-8"
        >
          Nuevo Control
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col w-[calc(100vw-1rem)] sm:max-w-xl max-h-[90dvh] rounded-2xl p-0 gap-0">
        <DialogHeader className="px-4 pt-5 sm:px-6 pb-3 border-b border-border">
          <DialogTitle className="text-base font-semibold">Control de Seguimiento</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Registra un nuevo control de seguimiento para esta medida
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 min-h-0">
          {medida_id && (
            <CreateFollowUpControlForm
              onClose={() => setOpen(false)}
              id={medida_id}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
