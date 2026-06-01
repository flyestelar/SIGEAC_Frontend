'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateAirworthinessDirectiveApplicabilitiesBulk,
} from '@/hooks/planificacion/directivas/queries';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanySlug } from '@/stores/CompanyStore';
import { useState } from 'react';

const createApplicabilitySchema = z
  .object({
    aircraft_ids: z.array(z.string()).default([]),
    is_applicable: z.boolean().default(true),
    non_applicability_reason: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.aircraft_ids.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Seleccione al menos una aeronave',
        path: ['aircraft_ids'],
      });
    }

    if (!values.is_applicable && !values.non_applicability_reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El motivo de no aplicabilidad es obligatorio',
        path: ['non_applicability_reason'],
      });
    }
  });

type CreateApplicabilityFormValues = {
  aircraft_ids: string[];
  is_applicable: boolean;
  non_applicability_reason?: string;
};

export default function CreateAirworthinessDirectiveApplicabilityForm({
  directiveId,
  existingAircraftIds,
  onSuccess,
}: {
  directiveId: number;
  existingAircraftIds: number[];
  onSuccess: () => void;
}) {
  const companySlug = useCompanySlug();
  const [selectedCount, setSelectedCount] = useState(0);
  const createApplicabilitiesBulk = useCreateAirworthinessDirectiveApplicabilitiesBulk(directiveId);
  const { data: aircraftResponse, isLoading: isAircraftLoading } = useGetMaintenanceAircrafts(companySlug);

  const form = useForm<CreateApplicabilityFormValues>({
    resolver: zodResolver(createApplicabilitySchema),
    defaultValues: {
      aircraft_ids: [],
      is_applicable: true,
      non_applicability_reason: '',
    },
  });

  const existingAircraftIdSet = useMemo(() => new Set(existingAircraftIds), [existingAircraftIds]);

  const availableAircraft = useMemo(
    () =>
      (aircraftResponse ?? []).filter((aircraft) => {
        const aircraftId = aircraft.id;
        return aircraftId == null || !existingAircraftIdSet.has(aircraftId);
      }),
    [aircraftResponse, existingAircraftIdSet],
  );

  const isApplicable = useWatch({ control: form.control, name: 'is_applicable' });

  const resetForm = () => {
    form.reset({
      aircraft_ids: [],
      is_applicable: true,
      non_applicability_reason: '',
    });
    setSelectedCount(0);
  };

  const onSubmit = async (values: CreateApplicabilityFormValues) => {
    const payload = {
      is_applicable: values.is_applicable,
      non_applicability_reason: values.is_applicable ? null : values.non_applicability_reason || null,
    };

    await createApplicabilitiesBulk.mutateAsync({
      path: { directiveId },
      body: {
        applicabilities: values.aircraft_ids.map((aircraftId) => ({
          aircraft_id: Number(aircraftId),
          ...payload,
        })),
      },
    });

    resetForm();
    onSuccess();
  };

  if (!isAircraftLoading && availableAircraft.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay aeronaves disponibles para agregar aplicabilidad.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="aircraft_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aeronaves</FormLabel>
              <FormControl>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                  {availableAircraft.map((aircraft) => {
                    const aircraftId = String(aircraft.id);
                    const selectedIds = Array.isArray(field.value) ? field.value : [];
                    const isChecked = selectedIds.includes(aircraftId);

                    return (
                      <label
                        key={aircraft.id}
                        className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-accent/40"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const nextSelectedIds = checked
                              ? [...selectedIds, aircraftId]
                              : selectedIds.filter((value) => value !== aircraftId);

                            field.onChange(nextSelectedIds);
                            setSelectedCount(nextSelectedIds.length);
                          }}
                          disabled={isAircraftLoading}
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{aircraft.acronym}</p>
                          <p className="text-xs text-muted-foreground">
                            {aircraft.aircraft_type?.full_name ?? aircraft.model}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </FormControl>
              <p className="text-xs text-muted-foreground">
                {selectedCount === 0
                  ? 'Seleccione una o varias aeronaves.'
                  : `${selectedCount} aeronave${selectedCount === 1 ? '' : 's'} seleccionada${selectedCount === 1 ? '' : 's'}.`}
              </p>
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

        <div className="flex justify-end gap-2">
          <Button type="submit" className="gap-2" disabled={createApplicabilitiesBulk.isPending || availableAircraft.length === 0}>
            {createApplicabilitiesBulk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar aplicabilidades
          </Button>
        </div>
      </form>
    </Form>
  );
}