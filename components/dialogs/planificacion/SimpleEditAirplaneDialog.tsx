'use client';

import { useUpdateMaintenanceAircraft } from '@/actions/planificacion/aeronaves/actions';
import { FormNumericField } from '@/components/forms/FormNumericField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAircraftTypes } from '@/hooks/planificacion/useGetAircraftTypes';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Plane, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface SimpleEditAirplaneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  acronym: string;
  companySlug: string;
  currentTypeId?: number;
  currentFlightHours?: number;
  currentFlightCycles?: number;
}

const formSchema = z.object({
  aircraft_type_id: z.number().optional(),
  flight_hours: z.coerce.number().min(0, 'Debe ser mayor o igual a 0').optional().nullable(),
  flight_cycles: z.coerce.number().int().min(0, 'Debe ser mayor o igual a 0').optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

export function SimpleEditAirplaneDialog(props: SimpleEditAirplaneDialogProps) {
  const { isOpen, onOpenChange, acronym } = props;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar aeronave</DialogTitle>
          <DialogDescription>Actualice la información de {acronym}.</DialogDescription>
        </DialogHeader>
        <SimpleEditAirplaneDialogContent {...props} />
      </DialogContent>
    </Dialog>
  );
}

function SimpleEditAirplaneDialogContent({
  companySlug,
  currentTypeId,
  currentFlightHours,
  currentFlightCycles,
  onOpenChange,
  isOpen,
  acronym,
}: SimpleEditAirplaneDialogProps) {
  const { data: aircraftTypesData } = useGetAircraftTypes(companySlug);
  const { updateMaintenanceAircraft } = useUpdateMaintenanceAircraft();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      aircraft_type_id: currentTypeId,
      flight_hours: currentFlightHours,
      flight_cycles: currentFlightCycles,
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { isDirty },
  } = form;

  // Reset form when dialog opens/closes or current values change
  useEffect(() => {
    if (isOpen) {
      reset({
        aircraft_type_id: currentTypeId,
        flight_hours: currentFlightHours,
        flight_cycles: currentFlightCycles,
      });
    }
  }, [isOpen, currentTypeId, currentFlightHours, currentFlightCycles, reset]);

  const onSubmit = async (data: FormData) => {
    if (!companySlug) return;

    const payload: any = {};

    if (data.aircraft_type_id !== currentTypeId) {
      payload.aircraft_type_id = data.aircraft_type_id;
    }

    if (data.flight_hours !== currentFlightHours) {
      payload.flight_hours = data.flight_hours;
    }

    if (data.flight_cycles !== currentFlightCycles) {
      payload.flight_cycles = data.flight_cycles;
    }

    if (Object.keys(payload).length === 0) return; // No changes

    await updateMaintenanceAircraft.mutateAsync({
      acronym: acronym,
      company: companySlug,
      data: payload,
    });

    onOpenChange(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="aircraft_type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Tipo de aeronave
              </FormLabel>
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(aircraftTypesData?.data ?? []).map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormNumericField
            control={control}
            name="flight_hours"
            label="Horas de vuelo"
            icon={Clock}
            inputProps={{
              placeholder: '0.0',
              thousandSeparator: '',
              decimalSeparator: ',',
              decimalScale: 2,
            }}
          />

          <FormNumericField
            control={control}
            name="flight_cycles"
            label="Ciclos"
            icon={RotateCcw}
            inputProps={{
              placeholder: '0',
              thousandSeparator: '',
              decimalSeparator: ',',
              decimalScale: 0,
            }}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateMaintenanceAircraft.isPending || !isDirty}>
            {updateMaintenanceAircraft.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
