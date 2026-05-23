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
import { CreateVoluntaryReportForm } from "@/components/forms/sms/CreateVoluntaryReportForm";
import { Analysis, DangerIdentification, VoluntaryReport } from "@/types";
import CreateAnalysisForm from "@/components/forms/sms/CreateAnalysisForm";

interface FormProps {
  id: string | number; // ID AL CUAL SERA ASIGNADO EL ANALISIS, MITIGATION OR IDENTIFICATION
  buttonTitle: string; // TITULO QUE CONTENDRA EL BOTON DEL DIALOG
  name: string; // NOMBRE AL CUAL SERA ASIGNADO EL ANALISIS, MITIGATION OR IDENTIFICATION
  initialData?: Analysis; // DATOS PARA INICIALIZAR CON INFORMACION PREVIA EL FORMULARIO PARA SU EDICION
  isEditing?: boolean; //PARA SABER SI ES UN EDIT O CREACION DE UN NUEVO ANALISIS
}

export default function CreateAnalysesDialog({
  id,
  buttonTitle,
  name,
  isEditing,
  initialData,
}: FormProps) {
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
          {buttonTitle}
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col w-[calc(100vw-1rem)] sm:max-w-3xl max-h-[90dvh] p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Análisis" : "Crear Análisis"}</DialogTitle>
          <DialogDescription>
            Selecciona la probabilidad y severidad del riesgo.
          </DialogDescription>
        </DialogHeader>

        {isEditing && initialData ? (
          <CreateAnalysisForm
            id={id}
            name={name}
            isEditing={true}
            initialData={initialData}
            onClose={() => setOpen(false)}
          />
        ) : (
          <CreateAnalysisForm
            onClose={() => setOpen(false)}
            name={name}
            id={id}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
