'use client';

import { useDeleteFlightControl } from '@/actions/planificacion/vuelos/actions';
import CreateFlightControlForm from '@/components/forms/mantenimiento/ordenes_trabajo/CreateFlightControlForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCompanyStore } from '@/stores/CompanyStore';
import { FlightControl } from '@/types';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface FlightControlRowActionsProps {
  flightControl: FlightControl;
}

export function FlightControlRowActions({ flightControl }: FlightControlRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { selectedCompany } = useCompanyStore();
  const { deleteFlightControl } = useDeleteFlightControl();

  const flightDataForForm = {
    id: flightControl.id,
    flight_number: flightControl.flight_number,
    aircraft_operator: flightControl.aircraft_operator,
    origin: flightControl.origin,
    destination: flightControl.destination,
    flight_date: flightControl.flight_date,
    departure_time: flightControl.departure_time,
    arrival_time: flightControl.arrival_time,
    flight_hours: Number(flightControl.flight_hours),
    flight_cycles: Number(flightControl.flight_cycles),
    aircraft_id: String(flightControl.aircraft?.id ?? ''),
  };

  const handleDelete = () => {
    if (!selectedCompany?.slug) return;
    deleteFlightControl.mutate({ id: flightControl.id, company: selectedCompany.slug });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={deleteFlightControl.isPending}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Editar Vuelo</DialogTitle>
            <DialogDescription>Modifica los datos del vuelo registrado.</DialogDescription>
          </DialogHeader>
          <CreateFlightControlForm flightData={flightDataForForm} onClose={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar vuelo</AlertDialogTitle>
            <AlertDialogDescription>
              Quita el registro de{' '}
              <span className="font-mono font-medium text-foreground">
                {flightControl.flight_number || 'vuelo sin número'}
              </span>
              . La acción no se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteFlightControl.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteFlightControl.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFlightControl.isPending ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
