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
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useState, useEffect } from "react";

import {
  useCreateObligatoryReport,
  useUpdateObligatoryReport,
  useGetNextReportNumber,
} from "@/actions/sms/reporte_obligatorio/actions";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useGetAircraftAcronyms } from "@/hooks/aerolinea/aeronaves/useGetAircraftAcronyms";
import { useGetPilots } from "@/hooks/sms/useGetPilots";
import { cn } from "@/lib/utils";
import { useCompanyStore } from "@/stores/CompanyStore";
import { ObligatoryReportResource } from "@/.gen/api/types.gen";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormProps {
  isEditing?: boolean;
  initialData?: ObligatoryReportResource;
  onClose: () => void;
}

const FormSchema = z.object({
  report_number: z.string().optional(),
  reference_number: z.string().optional(),
  report_date: z
    .date()
    .refine((val) => !isNaN(val.getTime()), { message: "Fecha inválida" }),
  incident_date: z
    .date()
    .refine((val) => !isNaN(val.getTime()), { message: "Fecha inválida" }),
  station: z.string().optional(),
  incident_location: z
    .string()
    .min(3, { message: "El lugar del incidente debe tener al menos 3 caracteres" })
    .max(50, { message: "El lugar del incidente no debe exceder los 50 caracteres" }),
  incident_location_other: z.string().optional(),
  danger_type: z.string().optional(),
  description: z
    .string()
    .min(3, { message: "La descripción debe tener al menos 3 caracteres" }),
  reporter_name: z.string().optional(),
  reporter_email: z.string().email({ message: "Correo inválido" }).optional().or(z.literal("")),
  reporter_phone: z.string().optional(),
  reporter_area: z.string().optional(),
  reporter_position: z.string().optional(),
  pilot_id: z.string().optional(),
  copilot_id: z.string().optional(),
  aircraft_id: z.string().optional(),
  image: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "Max 10MB")
    .refine(
      (file) => ["image/jpeg", "image/png"].includes(file.type),
      "Solo JPEG/PNG",
    )
    .optional(),
  document: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "Máximo 10MB")
    .refine(
      (file) => file.type === "application/pdf",
      "Solo se permiten archivos PDF",
    )
    .optional(),
});

type FormSchemaType = z.infer<typeof FormSchema>;

export function CreateObligatoryReportForm({
  onClose,
  isEditing,
  initialData,
}: FormProps) {
  const { user } = useAuth();
  const { selectedCompany } = useCompanyStore();
  const router = useRouter();

  const userRoles = user?.roles?.map((role) => role.name) || [];
  const shouldEnableField = userRoles.some((role) =>
    ["SUPERUSER", "ANALISTA_SMS", "JEFE_SMS"].includes(role),
  );

  const { createObligatoryReport } = useCreateObligatoryReport();
  const { updateObligatoryReport } = useUpdateObligatoryReport();

  const { data: pilots, isLoading: isLoadingPilots } = useGetPilots(selectedCompany?.slug);
  const { data: aircrafts, isLoading: isLoadingAircrafts } = useGetAircraftAcronyms(selectedCompany?.slug);

  const { data: nextNumberData, isPending: isLoadingNextNumber } =
    useGetNextReportNumber(selectedCompany?.slug || null);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      report_number: initialData?.report_number ?? "",
      reference_number: initialData?.reference_number ?? "",
      description: initialData?.description ?? "",
      incident_location: initialData?.incident_location ?? "",
      station: initialData?.station ?? "",
      incident_location_other: initialData?.incident_location_other ?? "",
      danger_type: initialData?.danger_type ?? "",
      reporter_name: initialData?.reporter_name ?? "",
      reporter_email: initialData?.reporter_email ?? "",
      reporter_phone: initialData?.reporter_phone ?? "",
      reporter_area: initialData?.reporter_area ?? "",
      reporter_position: initialData?.reporter_position ?? "",
      aircraft_id: initialData?.aircraft_id?.toString() ?? "",
      pilot_id: initialData?.pilot_id?.toString() ?? "",
      copilot_id: initialData?.copilot_id?.toString() ?? "",
      report_date: initialData?.report_date
        ? new Date(initialData.report_date)
        : new Date(),
      incident_date: initialData?.incident_date
        ? new Date(initialData.incident_date)
        : new Date(),
    },
  });

  useEffect(() => {
    if (initialData && isEditing) {
      if (initialData.report_number) {
        form.setValue("report_number", initialData.report_number);
      }
    } else if (!isEditing && nextNumberData?.next_number) {
      form.setValue("report_number", String(nextNumberData.next_number));
    }
  }, [initialData, isEditing, nextNumberData, form]);

  const onSubmit = async (data: FormSchemaType) => {
    if (isEditing && initialData) {
      await updateObligatoryReport.mutateAsync({
        company: selectedCompany!.slug,
        id: initialData.id.toString(),
        data: {
          ...data,
          report_date: data.report_date.toISOString(),
          incident_date: data.incident_date.toISOString(),
          status: initialData.status,
          danger_identification_id: initialData.danger_identification_id,
        },
      });
    } else {
      try {
        const response = await createObligatoryReport.mutateAsync({
          company: selectedCompany!.slug,
          data: {
            ...data,
            report_date: data.report_date.toISOString(),
            incident_date: data.incident_date.toISOString(),
            status: (shouldEnableField ? "ABIERTO" : "PROCESO") as "ABIERTO" | "PROCESO" | "CERRADO",
          },
        });
        if (shouldEnableField) {
          router.push(
            `/${selectedCompany?.slug}/sms/reportes/reportes_obligatorios/${response.obligatory_report_id}`,
          );
        } else {
          router.push(`/${selectedCompany?.slug}/dashboard`);
        }
      } catch (error) {
        console.error("Error al crear reporte:", error);
      }
    }
    onClose();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-4 p-1"
      >
          <FormLabel className="text-lg text-center m-2">
            Reporte Obligatorio de Suceso
          </FormLabel>

          {/* ── Identificación ── */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Identificación
            </p>
            <div className="grid grid-cols-2 gap-3">
              {shouldEnableField && (
                <FormField
                  control={form.control}
                  name="report_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código del Reporte</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center text-muted-foreground cursor-not-allowed select-none">
                          <span className="absolute left-2 select-none pointer-events-none">
                            ROS-
                          </span>
                          <Input
                            {...field}
                            placeholder={isLoadingNextNumber ? "Cargando..." : ""}
                            readOnly
                            tabIndex={-1}
                            className="bg-muted pl-12 font-bold pointer-events-none select-none"
                          />
                          {isLoadingNextNumber && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="reference_number"
                render={({ field }) => (
                  <FormItem className={cn(!shouldEnableField && "col-span-2")}>
                    <FormLabel>Número de Referencia</FormLabel>
                    <FormControl>
                      <Input placeholder="Referencia" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="station"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estación</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PZO">Puerto Ordaz</SelectItem>
                        <SelectItem value="MIQ">MIQ</SelectItem>
                        <SelectItem value="PMV">PMV</SelectItem>
                        <SelectItem value="MAR">MAR</SelectItem>
                        <SelectItem value="VIG">VIG</SelectItem>
                        <SelectItem value="BNS">BNS</SelectItem>
                        <SelectItem value="STD">STD</SelectItem>
                        <SelectItem value="STB">STB</SelectItem>
                        <SelectItem value="MUN">MUN</SelectItem>
                        <SelectItem value="SVSA">SVSA</SelectItem>
                        <SelectItem value="MADRID">MADRID</SelectItem>
                        <SelectItem value="CHILE">CHILE</SelectItem>
                        <SelectItem value="HAVANA">HAVANA</SelectItem>
                        <SelectItem value="SVZ">SVZ</SelectItem>
                        <SelectItem value="CANAIMA">CANAIMA</SelectItem>
                        <SelectItem value="MDPC">MDPC</SelectItem>
                        <SelectItem value="LIMA">LIMA</SelectItem>
                        <SelectItem value="PTY">PTY</SelectItem>
                        <SelectItem value="SKBO">SKBO</SelectItem>
                        <SelectItem value="N/A">NO APLICA</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ── Fechas ── */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Fechas
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="incident_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha del Incidente</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? format(field.value, "PPP", { locale: es })
                              : <span>Seleccione una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                          fromYear={1980}
                          toYear={new Date().getFullYear()}
                          captionLayout="dropdown-buttons"
                          components={{
                            Dropdown: (props) => (
                              <select {...props} className="bg-popover text-popover-foreground">
                                {props.children}
                              </select>
                            ),
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="report_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha del Reporte</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? format(field.value, "PPP", { locale: es })
                              : <span>Seleccione una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                          fromYear={1980}
                          toYear={new Date().getFullYear()}
                          captionLayout="dropdown-buttons"
                          components={{
                            Dropdown: (props) => (
                              <select {...props} className="bg-popover text-popover-foreground">
                                {props.children}
                              </select>
                            ),
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ── Ubicación ── */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Ubicación del Incidente
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="incident_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lugar del Incidente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HANGAR">HANGAR</SelectItem>
                        <SelectItem value="PLATAFORMA">PLATAFORMA</SelectItem>
                        <SelectItem value="AREA_ADMON">AREA ADMON</SelectItem>
                        <SelectItem value="AERONAVE">AERONAVE</SelectItem>
                        <SelectItem value="AEROPUERTO">AEROPUERTO</SelectItem>
                        <SelectItem value="N/A">NO APLICA</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="incident_location_other"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Otro Lugar del Incidente</FormLabel>
                    <FormControl>
                      <Input placeholder="Especificar otro lugar" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ── Clasificación y Descripción ── */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Clasificación y Descripción
            </p>
            <FormField
              control={form.control}
              name="danger_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Peligro</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HUMANO">HUMANO</SelectItem>
                      <SelectItem value="ORGANIZACIONAL">ORGANIZACIONAL</SelectItem>
                      <SelectItem value="TECNICOS">TECNICOS</SelectItem>
                      <SelectItem value="AMBIENTALES">AMBIENTALES</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del Suceso</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del suceso"
                      {...field}
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* ── Datos del Reportero ── */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Datos del Reportero
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="reporter_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reporter_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl>
                      <Input placeholder="correo@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reporter_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Teléfono" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reporter_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar área" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ANONIMO">ANONIMO</SelectItem>
                        <SelectItem value="APTO">
                          APTO
                        </SelectItem>
                        <SelectItem value="DISPATCH">
                          DISPATCH
                        </SelectItem>
                        <SelectItem value="GSE">
                          GSE
                        </SelectItem>
                        <SelectItem value="GTE. EST.">
                          GTE. EST.
                        </SelectItem>
                        <SelectItem value="SUMINISTRO">
                          SUMINISTRO
                        </SelectItem>
                        <SelectItem value="INAC">
                          INAC
                        </SelectItem>
                        <SelectItem value="MTTO">
                          MANTENIMIENTO
                        </SelectItem>
                        <SelectItem value="ING">
                          INGENIERIA
                        </SelectItem>
                        <SelectItem value="INST. CAP">
                          INST. CAP
                        </SelectItem>
                        <SelectItem value="N/A">
                          NO APLICA
                        </SelectItem>
                        <SelectItem value="OMA">
                          OMA
                        </SelectItem>
                        <SelectItem value="OPS">
                          OPS
                        </SelectItem>
                        <SelectItem value="QMS">
                          QMS
                        </SelectItem>
                        <SelectItem value="RR.HH">
                          RECURSOS HUMANOS
                        </SelectItem>
                        <SelectItem value="SGC">
                          SGC
                        </SelectItem>
                        <SelectItem value="SMS">
                          SMS
                        </SelectItem>
                        <SelectItem value="TDC">
                          TDC
                        </SelectItem>
                        <SelectItem value="TDM">
                          TDM
                        </SelectItem>
                        <SelectItem value="TFC">
                          TFC
                        </SelectItem>
                        <SelectItem value="CARG">
                          CARG
                        </SelectItem>
                        <SelectItem value="QMS_AVSEC">
                          QMS AVSEC
                        </SelectItem>
                        <SelectItem value="GTE_EQUIPAJE">
                          GTE EQUIPAJE
                        </SelectItem>
                        <SelectItem value="TALLER_SUPERVIVENCIA">
                          TALLER DE SUPERVIVENCIA
                        </SelectItem>
                        <SelectItem value="NDT">
                          NDT
                        </SelectItem>
                        <SelectItem value="AUDITORIA_INTERNA">
                          AUDITORIA INTERNA
                        </SelectItem>
                        <SelectItem value="AEROPUERTO">
                          AEROPUERTO
                      </SelectItem>

                      <SelectItem value="SSL">
                        SSL
                      </SelectItem>
                      <SelectItem value="TECNOLOGIA">
                        TECNOLOGIA
                      </SelectItem>
                      <SelectItem value="INFRAESTRUCTURA">
                        INFRAESTRUCTURA
                      </SelectItem>


                      <SelectItem value="AVSEC">AVSEC</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
                control={form.control}
                name="reporter_position"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input placeholder="Cargo" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ── Archivos Adjuntos ── */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Archivos Adjuntos
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen del Reporte</FormLabel>
                    <div className="flex flex-col gap-3">
                      {(field.value instanceof File || initialData?.image) && (
                        <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                          <Image
                            src={
                              field.value instanceof File
                                ? URL.createObjectURL(field.value)
                                : `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}${initialData?.image}`
                            }
                            alt="Preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/jpeg, image/png, image/jpg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) field.onChange(file);
                          }}
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
                    <FormLabel>Documento PDF</FormLabel>
                    <div className="flex flex-col gap-3">
                      {field.value && (
                        <div>
                          <p className="text-xs text-muted-foreground">Archivo seleccionado:</p>
                          <p className="font-semibold text-sm">{field.value.name}</p>
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
          </div>

          <div className="flex justify-between items-center gap-x-4">
            <Separator className="flex-1" />
            <p className="text-muted-foreground">SIGEAC</p>
            <Separator className="flex-1" />
          </div>
          <Button
            type="submit"
            disabled={createObligatoryReport.isPending || updateObligatoryReport.isPending}
          >
            {createObligatoryReport.isPending || updateObligatoryReport.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Enviar Reporte"
            )}
          </Button>
      </form>
    </Form>
  );
}
