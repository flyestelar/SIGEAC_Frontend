'use client';

import { useDebouncedInput } from '@/lib/useDebounce';
import { Edit, Loader2, PlusCircle, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  useCreateAircraftType,
  useDeleteAircraftType,
  useUpdateAircraftType,
} from '@/actions/planificacion/aircraft-types/actions';
import { ContentLayout } from '@/components/layout/ContentLayout';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetManufacturers } from '@/hooks/general/fabricantes/useGetManufacturers';
import { useGetAircraftTypes } from '@/hooks/planificacion/useGetAircraftTypes';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AircraftType } from '@/types';
import AircraftTypeForm, { AircraftTypeFormValues, DialogMode } from './_components/AircraftTypeForm';

const AircraftTypesPage = () => {
  const { selectedCompany } = useCompanyStore();
  const [search, setSearch] = useState('');
  const [input, setInput] = useDebouncedInput(search, (v) => setSearch(v), 500);
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<AircraftType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<AircraftType | null>(null);

  const { data: manufacturers = [] } = useGetManufacturers(selectedCompany?.slug);
  const { data: aircraftTypesResponse, isLoading, isError } = useGetAircraftTypes(selectedCompany?.slug, search);
  const aircraftTypes = aircraftTypesResponse?.data ?? [];

  const createAircraftType = useCreateAircraftType();
  const updateAircraftType = useUpdateAircraftType();
  const deleteAircraftType = useDeleteAircraftType();

  const aircraftManufacturers = useMemo(
    () => manufacturers.filter((manufacturer) => manufacturer.type === 'AIRCRAFT'),
    [manufacturers],
  );

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingType(null);
    setDialogOpen(true);
  };

  const openEditDialog = (type: AircraftType) => {
    setDialogMode('edit');
    setEditingType(type);
    setDialogOpen(true);
  };

  const openDeleteDialog = (type: AircraftType) => {
    setDeletingType(type);
    setDeleteDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingType(null);
  };

  const handleSubmit = async (values: AircraftTypeFormValues) => {
    if (!selectedCompany?.slug) return;

    const iataCode = values.iata_code?.trim();
    const manufacturerId = Number(values.manufacturer_id);

    if (dialogMode === 'create') {
      await createAircraftType.mutateAsync({
        company: selectedCompany.slug,
        data: {
          manufacturer_id: manufacturerId,
          family: values.family.trim(),
          series: values.series.trim(),
          iata_code: iataCode ? iataCode : null,
        },
      });
      closeDialog();
      return;
    }

    if (!editingType) return;

    const updatePayload: {
      family: string;
      series: string;
      iata_code: string | null;
      manufacturer_id?: number;
    } = {
      family: values.family.trim(),
      series: values.series.trim(),
      iata_code: iataCode ? iataCode : null,
    };

    if (editingType.manufacturer?.id !== manufacturerId) {
      updatePayload.manufacturer_id = manufacturerId;
    }

    await updateAircraftType.mutateAsync({
      company: selectedCompany.slug,
      id: editingType.id,
      data: updatePayload,
    });
    closeDialog();
  };

  const handleConfirmDelete = async () => {
    if (!selectedCompany?.slug || !deletingType) return;

    await deleteAircraftType.mutateAsync({
      company: selectedCompany.slug,
      id: deletingType.id,
    });
    setDeleteDialogOpen(false);
    setDeletingType(null);
  };

  if (!selectedCompany?.slug) {
    return (
      <ContentLayout title="Tipos de Aeronave">
        <div className="mt-10 text-center text-muted-foreground">Selecciona una compañía para gestionar los tipos.</div>
      </ContentLayout>
    );
  }

  // don't block the entire UI when loading — keep inputs usable

  return (
    <ContentLayout title="Tipos de Aeronave">
      <section className="rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-zinc-100 px-6 py-7 shadow-sm">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Tipos de Aeronave</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Administra la familia y serie de aeronave asociado a sus fabricantes.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="pl-9"
              placeholder="Buscar por fabricante, familia, serie o IATA"
            />
          </div>

          <Button onClick={openCreateDialog} className="gap-2">
            <PlusCircle className="size-4" />
            Nuevo tipo
          </Button>
        </div>

        {isError ? (
          <div className="rounded-lg border border-dashed border-destructive/40 px-4 py-10 text-center text-sm text-destructive">
            No se pudieron cargar los tipos de aeronave en este momento.
          </div>
        ) : isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto size-10 animate-spin text-muted-foreground" />
            <div className="mt-2 text-sm text-muted-foreground">Cargando tipos de aeronave…</div>
          </div>
        ) : aircraftTypes.length > 0 ? (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fabricante</TableHead>
                  <TableHead>Familia</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>IATA</TableHead>
                  <TableHead>Certificado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aircraftTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-semibold">{type.manufacturer?.name ?? 'Sin fabricante'}</TableCell>
                    <TableCell>{type.family}</TableCell>
                    <TableCell>{type.series}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{type.iata_code ?? 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{type.type_certificate || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(type)}>
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(type)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/40 px-4 py-10 text-center text-sm text-muted-foreground">
            No se encontraron tipos de aeronave con los filtros actuales.
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Registrar tipo de aeronave' : 'Editar tipo de aeronave'}
            </DialogTitle>
            <DialogDescription>
              Completa la información del tipo de aeronave según los campos permitidos por la API.
            </DialogDescription>
          </DialogHeader>

          <AircraftTypeForm
            mode={dialogMode}
            initialData={editingType}
            manufacturers={aircraftManufacturers}
            submitting={createAircraftType.isPending || updateAircraftType.isPending}
            onCancel={closeDialog}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tipo de aeronave</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el tipo {deletingType?.family} {deletingType?.series}. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteAircraftType.isPending}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContentLayout>
  );
};

export default AircraftTypesPage;
