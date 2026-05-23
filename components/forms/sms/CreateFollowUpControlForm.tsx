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
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { useCreateFollowUpControl } from "@/actions/sms/controles_de_seguimiento/actions";
import { useGetActivitiesByMeasure } from "@/hooks/sms/useGetActivitiesByMeasure";
import { Separator } from "@/components/ui/separator";
import { useParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useCompanyStore } from "@/stores/CompanyStore";
const FormSchema = z.object({
  description: z
    .string()
    .min(3, { message: "La observacion debe tener al menos 3 caracteres" })
    .max(255, { message: "La observacion no puede exceder los 255 caracteres" }),

  date: z
    .date()
    .refine((val) => !isNaN(val.getTime()), { message: "Invalid Date" }),

  sms_activity_id: z.number().nullable().optional(),

  image: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "Max 5MB")
    .refine(
      (file) => ["image/jpeg", "image/png"].includes(file.type),
      "Solo JPEG/PNG"
    )
    .optional(),

  document: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "Máximo 5MB")
    .refine(
      (file) => file.type === "application/pdf",
      "Solo se permiten archivos PDF"
    )
    .optional(),
});

type FormSchemaType = z.infer<typeof FormSchema>;

interface FormProps {
  id: number | string;
  onClose: () => void;
}

export default function CreateFollowUpControlForm({ onClose, id }: FormProps) {
  const { plan_id, medida_id } = useParams<{
    plan_id: string;
    medida_id: string;
  }>();
  const { selectedCompany } = useCompanyStore();

  const { createFollowUpControl } = useCreateFollowUpControl();
  const { data: activities } = useGetActivitiesByMeasure({
    company: selectedCompany?.slug,
    measure_id: id,
  });
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: { date: new Date(), sms_activity_id: null },
  });

  const onSubmit = async (data: FormSchemaType) => {
    const values = {
      company: selectedCompany!.slug,
      data: {
        ...data,
        mitigation_measure_id: id,
      },
    };
    console.log(values);
    await createFollowUpControl.mutateAsync(values);

    onClose();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Descripción del Control
              </FormLabel>
              <FormControl>
                <Textarea placeholder="Describe el control de seguimiento" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sms_activity_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Actividad SMS Vinculada (opcional)
              </FormLabel>
              <Select
                onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
                value={field.value != null ? String(field.value) : "none"}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <span className="truncate">
                      <SelectValue placeholder="Sin actividad vinculada" />
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin actividad vinculada</SelectItem>
                  {activities?.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.activity_number} — {a.title || a.activity_name}
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
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Fecha del Seguimiento
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50 flex-shrink-0" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    startMonth={new Date(1980, 0)}
                    endMonth={new Date(new Date().getFullYear(), 11)}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Imagen General
                </FormLabel>
                <div className="flex flex-col gap-2">
                  {field.value && (
                    <Image
                      src={URL.createObjectURL(field.value)}
                      alt="Preview"
                      className="h-32 w-full rounded-lg object-cover border"
                      width={400}
                      height={128}
                    />
                  )}
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/jpeg, image/png"
                      onChange={(e) => field.onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="document"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Documento PDF
                </FormLabel>
                <div className="flex flex-col gap-2">
                  {field.value && (
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Archivo seleccionado:</p>
                      <p className="font-semibold text-sm truncate">{field.value.name}</p>
                    </div>
                  )}
                  <FormControl>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => field.onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-3 text-muted-foreground">
          <Separator className="flex-1" />
          <span className="text-xs">SIGEAC</span>
          <Separator className="flex-1" />
        </div>

        <Button type="submit" disabled={createFollowUpControl.isPending} className="w-full rounded-xl">
          {createFollowUpControl.isPending ? "Enviando..." : "Enviar"}
        </Button>
      </form>
    </Form>
  );
}
