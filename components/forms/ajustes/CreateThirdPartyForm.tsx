'use client';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { useCreateThirdParty } from '@/actions/ajustes/globales/terceros/actions';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetThirdPartyRoles } from '@/hooks/ajustes/globales/terceros/useGetThirdPartyRoles';

type RoleOption = { id: string; label: string };

const formSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: 'Email inválido.' }),
  phone: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED'], { required_error: 'Seleccione un estado.' }),
  party_roles_ids: z.array(z.string()).min(1, { message: 'Seleccione al menos un rol.' }),
});

export interface ThirdPartyData {
  name: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  party_roles_ids: string[];
}

interface FormProps {
  onClose: () => void;
  roles: RoleOption[];
  defaultStatus?: ThirdPartyData['status'];
}

function statusBadgeVariant(status: ThirdPartyData['status']) {
  if (status === 'ACTIVE') return 'default';
  if (status === 'BLOCKED') return 'destructive';
  return 'secondary';
}

function normalizeOptional(v?: string) {
  const t = (v ?? '').trim();
  return t.length ? t : undefined;
}

export default function CreateThirdPartyForm({ onClose, defaultStatus = 'ACTIVE' }: FormProps) {
  const { selectedCompany } = useCompanyStore();
  const { createThirdParty } = useCreateThirdParty();
  const { data: roles, isLoading: rolesLoading, isError: rolesError } = useGetThirdPartyRoles();
  const [openRoles, setOpenRoles] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: defaultStatus,
      party_roles_ids: [],
    },
    mode: 'onChange',
  });

  const handleRoleSelect = (currentValue: string) => {
    setSelectedRoles((prevSelected) =>
      prevSelected.includes(currentValue)
        ? prevSelected.filter((value) => value !== currentValue)
        : [...prevSelected, currentValue],
    );
  };

  const isRoleSelected = (value: string) => selectedRoles.includes(value);

  useEffect(() => {
    form.setValue('party_roles_ids', selectedRoles);
  }, [selectedRoles, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedCompany?.slug) return;

    const payload: ThirdPartyData = {
      name: values.name.trim(),
      email: normalizeOptional(values.email),
      phone: normalizeOptional(values.phone),
      status: values.status,
      party_roles_ids: values.party_roles_ids,
    };

    await createThirdParty.mutateAsync(payload);

    form.reset({
      name: '',
      email: '',
      phone: '',
      status: defaultStatus,
      party_roles_ids: [],
    });

    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <Separator />
        {/* Datos principales */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Proveedor ABC, Juan Pérez..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (opcional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="correo@dominio.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: +58 412 123 4567" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Estado + Roles */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Estado</FormLabel>
                  <Badge variant={statusBadgeVariant(field.value)} className="rounded-full">
                    {field.value}
                  </Badge>
                </div>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Seleccione un estado..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="party_roles_ids"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2">
                <FormLabel>Rol(es)</FormLabel>
                <Popover open={openRoles} onOpenChange={setOpenRoles}>
                  <PopoverTrigger asChild>
                    <Button disabled={rolesLoading || rolesError} variant="outline" className="justify-between">
                      {selectedRoles?.length > 0 && (
                        <>
                          <Separator orientation="vertical" className="mx-2 h-4" />
                          <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                            {selectedRoles.length}
                          </Badge>
                          <div className="hidden space-x-1 lg:flex">
                            {selectedRoles.length > 2 ? (
                              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                {selectedRoles.length} seleccionados
                              </Badge>
                            ) : (
                              roles
                                ?.filter((option) => selectedRoles.includes(option.id.toString()))
                                .map((option) => (
                                  <Badge variant="secondary" key={option.label} className="rounded-sm px-1 font-medium">
                                    {option.label}
                                  </Badge>
                                ))
                            )}
                          </div>
                        </>
                      )}
                      {selectedRoles.length <= 0 && 'Seleccione...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar rol..." />
                      <CommandList>
                        <CommandEmpty>No se han encontrado roles...</CommandEmpty>
                        <CommandGroup>
                          {rolesLoading && <Loader2 className="animate-spin size-4" />}
                          {roles?.map((role) => (
                            <CommandItem
                              key={role.id}
                              value={role.id.toString()}
                              onSelect={() => handleRoleSelect(role.id.toString())}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  isRoleSelected(role.id.toString()) ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {role.label}
                            </CommandItem>
                          ))}
                          {rolesError && (
                            <p className="text-center text-muted-foreground text-sm">
                              Ha ocurrido un error al cargar los roles...
                            </p>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={createThirdParty.isPending}>
            Cancelar
          </Button>

          <Button type="submit" className="rounded-xl" disabled={createThirdParty.isPending}>
            {createThirdParty.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </span>
            ) : (
              'Crear'
            )}
          </Button>
        </div>

        {/* Error backend (si tu hook lo expone) */}
        {!!(createThirdParty as any)?.error && (
          <p className="text-sm text-destructive">
            {String((createThirdParty as any).error?.message ?? 'Error al crear el tercero.')}
          </p>
        )}
      </form>
    </Form>
  );
}
