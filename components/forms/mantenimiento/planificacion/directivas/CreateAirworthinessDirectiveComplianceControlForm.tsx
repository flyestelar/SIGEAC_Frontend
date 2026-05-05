'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Loader2, RotateCw, Save, Timer, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormDatePickerField } from '@/components/forms/FormDatePickerField';
import { FormNumericField } from '@/components/forms/FormNumericField';
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
import { Form } from '@/components/ui/form';
import {
  useCreateAirworthinessDirectiveComplianceControl,
  useDeleteAirworthinessDirectiveComplianceControl,
  useUpdateAirworthinessDirectiveComplianceControl,
} from '@/hooks/planificacion/directivas/queries';
import type {
  AirworthinessDirectiveApplicabilityResource,
  AirworthinessDirectiveComplianceControlResource,
} from '@api/types';

const complianceControlSchema = z
  .object({
    calendar_due_date: z.string().optional(),
    flight_hours_due: z.number().min(0, 'Debe ser mayor o igual a 0').nullable().optional(),
    cycles_due: z.number().min(0, 'Debe ser mayor o igual a 0').nullable().optional(),
    recurrence_interval_days: z.number().min(0, 'Debe ser mayor o igual a 0').nullable().optional(),
    recurrence_interval_hours: z.number().min(0, 'Debe ser mayor o igual a 0').nullable().optional(),
    recurrence_interval_cycles: z.number().min(0, 'Debe ser mayor o igual a 0').nullable().optional(),
  })
  .superRefine((values, context) => {
    const hasAtLeastOneValue = [
      values.calendar_due_date,
      values.flight_hours_due,
      values.cycles_due,
      values.recurrence_interval_days,
      values.recurrence_interval_hours,
      values.recurrence_interval_cycles,
    ].some((value) => value !== undefined && value !== null && value !== '');

    if (!hasAtLeastOneValue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes configurar al menos un vencimiento o una recurrencia.',
        path: ['calendar_due_date'],
      });
    }
  });

type ComplianceControlFormValues = z.infer<typeof complianceControlSchema>;

interface CreateAirworthinessDirectiveComplianceControlFormProps {
  directiveId: number;
  applicability: AirworthinessDirectiveApplicabilityResource;
  control?: AirworthinessDirectiveComplianceControlResource;
  onSuccess: () => void;
}

const getDefaultValues = (
  control?: AirworthinessDirectiveComplianceControlResource,
): ComplianceControlFormValues => ({
  calendar_due_date: control?.calendar_due_date ?? '',
  flight_hours_due: control?.flight_hours_due ?? null,
  cycles_due: control?.cycles_due ?? null,
  recurrence_interval_days: control?.recurrence_interval_days ?? null,
  recurrence_interval_hours: control?.recurrence_interval_hours ?? null,
  recurrence_interval_cycles: control?.recurrence_interval_cycles ?? null,
});

export default function CreateAirworthinessDirectiveComplianceControlForm({
  directiveId,
  applicability,
  control,
  onSuccess,
}: CreateAirworthinessDirectiveComplianceControlFormProps) {
  const isEditing = Boolean(control);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const createControl = useCreateAirworthinessDirectiveComplianceControl(directiveId);
  const updateControl = useUpdateAirworthinessDirectiveComplianceControl(directiveId);
  const deleteControl = useDeleteAirworthinessDirectiveComplianceControl(directiveId);

  const form = useForm<ComplianceControlFormValues>({
    resolver: zodResolver(complianceControlSchema),
    defaultValues: getDefaultValues(control),
  });

  useEffect(() => {
    form.reset(getDefaultValues(control));
  }, [control, form]);

  const onSubmit = async (values: ComplianceControlFormValues) => {
    const payload = {
      calendar_due_date: values.calendar_due_date || null,
      flight_hours_due: values.flight_hours_due ?? null,
      cycles_due: values.cycles_due ?? null,
      recurrence_interval_days: values.recurrence_interval_days ?? null,
      recurrence_interval_hours: values.recurrence_interval_hours ?? null,
      recurrence_interval_cycles: values.recurrence_interval_cycles ?? null,
    };

    if (isEditing) {
      await updateControl.mutateAsync({
        path: {
          directiveId,
          applicabilityId: applicability.id,
        },
        body: payload,
      });
    } else {
      await createControl.mutateAsync({
        path: {
          directiveId,
          applicabilityId: applicability.id,
        },
        body: payload,
      });
    }

    onSuccess();
  };

  const onDelete = async () => {
    await deleteControl.mutateAsync({
      path: {
        directiveId,
        applicabilityId: applicability.id,
      },
    });

    setIsDeleteDialogOpen(false);
    onSuccess();
  };

  const isSubmitting = createControl.isPending || updateControl.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border bg-muted/30 p-4">
          <p className="text-sm font-medium">{applicability.aircraft?.acronym ?? `#${applicability.aircraft_id}`}</p>
          <p className="text-xs text-muted-foreground">
            {applicability.aircraft?.aircraft_type?.full_name ?? applicability.aircraft?.model ?? 'Sin modelo'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormDatePickerField
            control={form.control}
            name="calendar_due_date"
            label="Vencimiento por fecha"
            icon={CalendarDays}
            placeholder="Seleccione fecha"
            valueType="string"
          />

          <FormNumericField
            control={form.control}
            name="flight_hours_due"
            label="Vence por FH"
            icon={Timer}
            inputProps={{ thousandSeparator: '', decimalSeparator: '.', decimalScale: 2, placeholder: '0.00' }}
          />

          <FormNumericField
            control={form.control}
            name="cycles_due"
            label="Vence por FC"
            icon={RotateCw}
            inputProps={{ thousandSeparator: '', decimalSeparator: '.', decimalScale: 0, placeholder: '0' }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormNumericField
            control={form.control}
            name="recurrence_interval_days"
            label="Recurrencia días"
            inputProps={{ thousandSeparator: '', decimalSeparator: '.', decimalScale: 0, placeholder: '0' }}
          />

          <FormNumericField
            control={form.control}
            name="recurrence_interval_hours"
            label="Recurrencia horas"
            inputProps={{ thousandSeparator: '', decimalSeparator: '.', decimalScale: 2, placeholder: '0.00' }}
          />

          <FormNumericField
            control={form.control}
            name="recurrence_interval_cycles"
            label="Recurrencia ciclos"
            inputProps={{ thousandSeparator: '', decimalSeparator: '.', decimalScale: 0, placeholder: '0' }}
          />
        </div>

        <div className="flex justify-end gap-2">
          {isEditing && (
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <Button
                type="button"
                variant="destructive"
                className="gap-2"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleteControl.isPending}
              >
                {deleteControl.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar control</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará el control de cumplimiento actual si no tiene historial de ejecución.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteControl.isPending}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} disabled={deleteControl.isPending}>
                    {deleteControl.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button type="submit" className="gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditing ? 'Guardar cambios' : 'Guardar control'}
          </Button>
        </div>
      </form>
    </Form>
  );
}