'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useDeleteAirworthinessDirectiveApplicability,
  useUpdateAirworthinessDirectiveApplicability,
} from '@/hooks/planificacion/directivas/queries';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanySlug } from '@/stores/CompanyStore';
import type { AirworthinessDirectiveApplicabilityResource } from '@api/types';

const editApplicabilitySchema = z
  .object({
    aircraft_id: z.string().min(1, 'La aeronave es obligatoria'),
    is_applicable: z.boolean().default(true),
    non_applicability_reason: z.string().trim().optional(),
    amoc_approved_method: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.is_applicable && !values.non_applicability_reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El motivo de no aplicabilidad es obligatorio',
        path: ['non_applicability_reason'],
      });
    }
  });

type EditApplicabilityFormValues = z.infer<typeof editApplicabilitySchema>;

export default function EditAirworthinessDirectiveApplicabilityForm({
  directiveId,
  existingAircraftIds,
  applicability,
  onSuccess,
}: {
  directiveId: number;
  existingAircraftIds: number[];
  applicability: AirworthinessDirectiveApplicabilityResource;
  onSuccess: () => void;
}) {
  const companySlug = useCompanySlug();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const updateApplicability = useUpdateAirworthinessDirectiveApplicability(directiveId);
  const deleteApplicability = useDeleteAirworthinessDirectiveApplicability(directiveId);
  const { data: aircraftResponse, isLoading: isAircraftLoading } = useGetMaintenanceAircrafts(companySlug);

  const form = useForm<EditApplicabilityFormValues>({
    resolver: zodResolver(editApplicabilitySchema),
    defaultValues: {
      aircraft_id: String(applicability.aircraft_id),
      is_applicable: applicability.is_applicable ?? true,
      non_applicability_reason: applicability.non_applicability_reason ?? '',
      amoc_approved_method: applicability.amoc_approved_method ?? '',
    },
  });

  const existingAircraftIdSet = useMemo(() => new Set(existingAircraftIds), [existingAircraftIds]);

  const availableAircraft = useMemo(() => {
    return (aircraftResponse ?? []).filter(
      (aircraft) => !existingAircraftIdSet.has(aircraft.id) || aircraft.id === applicability.aircraft_id,
    );
  }, [aircraftResponse, existingAircraftIdSet, applicability.aircraft_id]);

  const isApplicable = useWatch({ control: form.control, name: 'is_applicable' });

  const resetForm = () => {
    form.reset({
      aircraft_id: String(applicability.aircraft_id),
      is_applicable: applicability.is_applicable ?? true,
      non_applicability_reason: applicability.non_applicability_reason ?? '',
      amoc_approved_method: applicability.amoc_approved_method ?? '',
    });
  };

  const onSubmit = async (values: EditApplicabilityFormValues) => {
    await updateApplicability.mutateAsync({
      path: { directiveId, applicabilityId: applicability.id },
      body: {
        aircraft_id: Number(values.aircraft_id),
        is_applicable: values.is_applicable,
        non_applicability_reason: values.is_applicable ? null : values.non_applicability_reason || null,
        amoc_approved_method: values.amoc_approved_method || null,
      },
    });

    resetForm();
    onSuccess();
  };

  const onDelete = async () => {
    await deleteApplicability.mutateAsync({
      path: { directiveId, applicabilityId: applicability.id },
    });

    setIsDeleteDialogOpen(false);
    onSuccess();
  };

  if (!isAircraftLoading && availableAircraft.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay aeronaves disponibles para editar esta aplicabilidad.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="aircraft_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aeronave</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isAircraftLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isAircraftLoading ? 'Cargando aeronaves...' : 'Seleccione aeronave'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableAircraft.map((aircraft) => (
                    <SelectItem key={aircraft.id} value={String(aircraft.id)}>
                      {aircraft.acronym} - {aircraft.aircraft_type?.full_name ?? aircraft.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_applicable"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <div className="space-y-1">
                <FormLabel className="text-sm">Aplica a la aeronave</FormLabel>
                <p className="text-xs text-muted-foreground">Marca si esta directiva aplica operativamente a la aeronave.</p>
              </div>
              <FormControl>
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {!isApplicable && (
          <FormField
            control={form.control}
            name="non_applicability_reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo de no aplicabilidad</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe por qué la directiva no aplica a esta aeronave"
                    className="min-h-24"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="amoc_approved_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AMOC aprobado</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ingrese el método alternativo aprobado si aplica"
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <Button
              type="button"
              variant="destructive"
              className="gap-2"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={deleteApplicability.isPending}
            >
              {deleteApplicability.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Eliminar
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar aplicabilidad</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. La aplicabilidad se eliminará de forma permanente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteApplicability.isPending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} disabled={deleteApplicability.isPending}>
                  {deleteApplicability.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" className="gap-2" disabled={updateApplicability.isPending}>
            {updateApplicability.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </Form>
  );
}