"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { es } from "date-fns/locale";
import { CalendarIcon, Plus } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import {
  useCreateMitigationPlan,
  useUpdateMitigationPlan,
} from "@/actions/sms/planes_de_mitigation/actions";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useCompanyStore } from "@/stores/CompanyStore";
import { MitigationPlanResource } from "@api/types.gen";
import { useGetSmsAreas } from "@/hooks/sms/useGetSmsAreas";
import { CreateSmsAreaForm } from "@/components/forms/sms/CreateSmsAreaForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

const FormSchema = z.object({
  description: z
    .string()
    .min(5, { message: "La descripción debe tener al menos 5 caracteres" })
    .max(200, { message: "La descripción no puede exceder los 200 caracteres" }),

  area: z.string().min(1, { message: "Seleccione un área" }),

  responsible_name: z.string().max(50).optional(),

  responsible_last_name: z.string().max(50).optional(),

  start_date: z
    .date()
    .refine((val) => !isNaN(val.getTime()), { message: "Fecha Invalida" }),
});

type FormSchemaType = z.infer<typeof FormSchema>;

interface FormProps {
  onClose: () => void;
  id: number;
  isEditing?: boolean;
  initialData?: MitigationPlanResource;
}

export default function CreateMitigationPlanForm({
  onClose,
  id,
  initialData,
  isEditing,
}: FormProps) {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: initialData?.description ?? '',
      area: initialData?.area ?? '',
      responsible_name: initialData?.responsible_name ?? '',
      responsible_last_name: initialData?.responsible_last_name ?? '',
      start_date: initialData?.start_date
        ? new Date(initialData.start_date)
        : new Date(),
    },
  });

  const { selectedCompany } = useCompanyStore();
  const { createMitigationPlan } = useCreateMitigationPlan();
  const { updateMitigationPlan } = useUpdateMitigationPlan();
  const { data: areas, isLoading: isLoadingAreas } = useGetSmsAreas(selectedCompany?.slug);
  const [openCreateArea, setOpenCreateArea] = useState(false);
  const [openAreaCombobox, setOpenAreaCombobox] = useState(false);

  const onSubmit = async (data: FormSchemaType) => {
    if (isEditing && initialData) {
      await updateMitigationPlan.mutateAsync({
        company: selectedCompany!.slug,
        id: initialData.id.toString(),
        data: {
          description: data.description,
          area: data.area,
          responsible_name: data.responsible_name || null,
          responsible_last_name: data.responsible_last_name || null,
          start_date: data.start_date,
        },
      });
    } else {
      await createMitigationPlan.mutateAsync({
        company: selectedCompany!.slug,
        data: {
          description: data.description,
          area: data.area,
          responsible_name: data.responsible_name || null,
          responsible_last_name: data.responsible_last_name || null,
          start_date: data.start_date,
          danger_identification_id: id,
        },
      });
    }
    onClose();
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col space-y-3"
        >
          <FormLabel className="text-lg text-center m-2">
            Plan de Mitigacion
          </FormLabel>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripcion del Plan</FormLabel>
                <FormControl>
                  <Textarea placeholder="" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                    Área
                  </FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs text-primary hover:bg-primary/10"
                    onClick={() => setOpenCreateArea(true)}
                  >
                    <Plus className="h-3 w-3" />
                    Nueva
                  </Button>
                </div>
                <Popover open={openAreaCombobox} onOpenChange={setOpenAreaCombobox}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn("h-9 w-full justify-between text-sm font-normal", !field.value && "text-muted-foreground")}
                        disabled={isLoadingAreas}
                      >
                        {field.value || (isLoadingAreas ? "Cargando..." : "Seleccionar o escribir área")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar o escribir área..."
                        onValueChange={(search) => {
                          field.onChange(search);
                        }}
                      />
                      <CommandList>
                        <CommandEmpty
                          className="py-2 px-3 text-sm cursor-pointer hover:bg-accent"
                          onClick={() => setOpenAreaCombobox(false)}
                        >
                          Usar &ldquo;{field.value}&rdquo;
                        </CommandEmpty>
                        <CommandGroup>
                          {areas?.map((area) => (
                            <CommandItem
                              key={area.id}
                              value={area.name}
                              onSelect={(val) => {
                                field.onChange(val);
                                setOpenAreaCombobox(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", field.value === area.name ? "opacity-100" : "opacity-0")} />
                              {area.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="responsible_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                    Nombre del Responsable
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsible_last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                    Apellido del Responsable
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Apellido" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2.5 w-full">
                <FormLabel>Fecha de Estimada de Ejecución</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccione una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between items-center gap-x-4">
            <Separator className="flex-1" />
            <p className="text-muted-foreground">SIGEAC</p>
            <Separator className="flex-1" />
          </div>
          <Button
            type="submit"
            disabled={createMitigationPlan.isPending || updateMitigationPlan.isPending}
          >
            {isEditing ? "Actualizar" : "Crear"}
          </Button>
        </form>
      </Form>

      <Dialog open={openCreateArea} onOpenChange={setOpenCreateArea}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva Área</DialogTitle>
            <DialogDescription>El área quedará disponible en el selector.</DialogDescription>
          </DialogHeader>
          <CreateSmsAreaForm onClose={() => setOpenCreateArea(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
