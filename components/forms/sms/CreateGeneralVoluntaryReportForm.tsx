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

import {
  useCreateVoluntaryReport,
  useUpdateVoluntaryReport,
} from "@/actions/sms/reporte_voluntario/actions";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { VoluntaryReportResource } from "@/.gen/api/types.gen";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarIcon,
  CheckCircle2,
  ChevronRight,
  FileText,
  Hash,
  Loader2,
  MapPin,
  Paperclip,
  Upload,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCompanyStore } from "@/stores/CompanyStore";

interface FormProps {
  onClose: () => void;
  initialData?: VoluntaryReportResource;
  isEditing?: boolean;
}

function Section({
  num,
  icon: Icon,
  title,
  children,
}: {
  num: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-lg border border-border overflow-hidden mb-2.5 border-l-[3px] border-l-amber-500">
      <div className="flex items-center gap-0 bg-muted/40 border-b border-border">
        <div className="flex items-center justify-center w-10 h-full py-2 border-r border-border/60 bg-amber-500/5">
          <span className="font-mono text-[12px] font-bold text-amber-500 tabular-nums">
            {num}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 flex-1">
          <Icon className="w-3 h-3 text-amber-600/70" />
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
            {title}
          </span>
        </div>
      </div>
      <div className="p-4 bg-background">{children}</div>
    </div>
  );
}

function DateField({
  value,
  onChange,
  label,
  disableFuture = true,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label: string;
  disableFuture?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between text-left font-normal h-9 text-sm border-border hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors group"
          >
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5 text-amber-500/70 group-hover:text-amber-500 transition-colors" />
              {value ? format(value, "PPP", { locale: es }) : "Seleccione fecha"}
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 rotate-90" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            disabled={disableFuture ? (date) => date > new Date() : undefined}
            initialFocus
            startMonth={new Date(1980, 0)}
            endMonth={new Date(new Date().getFullYear(), 11)}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CreateGeneralVoluntaryReportForm({
  onClose,
  isEditing,
  initialData,
}: FormProps) {
  const { selectedCompany, selectedStation } = useCompanyStore();
  const params = useParams<{ company?: string }>();
  const companySlug = selectedCompany?.slug ?? params.company ?? "";
  const { createVoluntaryReport } = useCreateVoluntaryReport();
  const { updateVoluntaryReport } = useUpdateVoluntaryReport();
  const [isAnonymous, setIsAnonymous] = useState(true);
  const router = useRouter();

  const { user } = useAuth();

  const userRoles = user?.roles?.map((role) => role.name) || [];

  const shouldEnableField = userRoles.some((role) =>
    ["SUPERUSER", "ANALISTA_SMS", "JEFE_SMS"].includes(role)
  );

  const FormSchema = z.object({
    identification_date: z
      .date()
      .refine((val) => !isNaN(val.getTime()), { message: "Invalid Date" }),
    report_date: z
      .date()
      .refine((val) => !isNaN(val.getTime()), { message: "Invalid Date" }),

    report_number: shouldEnableField
      ? z
          .string()
          .min(1, "El número de reporte es obligatorio")
          .refine((val) => !isNaN(Number(val)), {
            message: "El valor debe ser un número",
          })
      : z
          .string()
          .refine((val) => val === "" || !isNaN(Number(val)), {
            message: "El valor debe ser un número o estar vacío",
          })
          .optional(),

    station: z.string(),
    finding_location: z.string(),
    finding_location_other: z.string(),
    description: z
      .string()
      .min(3, { message: "La descripción debe tener al menos 3 caracteres" })
      .max(255, { message: "La descripción no debe exceder los 255 caracteres" }),
    possible_consequences: z
      .string()
      .min(3, { message: "Las consecuencias deben tener al menos 3 caracteres" })
      .max(255, { message: "Las consecuencias no debe exceder los 255 caracteres" }),

    reporter_name: z
      .string()
      .min(3, { message: "El nombre de quien reporta debe tener al menos 3 letras." })
      .max(40)
      .optional(),
    reporter_last_name: z
      .string()
      .min(3, { message: "El Apellido de quien reporta debe tener al menos 3 letras." })
      .max(40)
      .optional(),
    reporter_phone: z
      .string()
      .regex(/^\d{11}$/, { message: "El número telefónico debe tener almenos 11 dígitos" })
      .optional(),
    reporter_email: z
      .string()
      .min(10, { message: "El correo electrónico debe tener al menos 10 caracteres" })
      .email({ message: "Formato de correo electrónico inválido" })
      .optional(),
    image: z
      .instanceof(File)
      .refine((file) => file.size <= 5 * 1024 * 1024, "Max 5MB")
      .refine((file) => ["image/jpeg", "image/png"].includes(file.type), "Solo JPEG/PNG")
      .optional(),
    document: z
      .instanceof(File)
      .refine((file) => file.size <= 5 * 1024 * 1024, "Máximo 5MB")
      .refine((file) => file.type === "application/pdf", "Solo se permiten archivos PDF")
      .optional(),
  });

  type FormSchemaType = z.infer<typeof FormSchema>;

  useEffect(() => {
    if (initialData && isEditing) {
      setIsAnonymous(initialData.is_anonymous);
    }
  }, [initialData, isEditing]);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      report_number: initialData?.report_number || "",
      finding_location: initialData?.finding_location ?? "",
      station: initialData?.station ?? "",
      description: initialData?.description || "",
      possible_consequences: Array.isArray(initialData?.possible_consequences)
        ? (initialData.possible_consequences as string[]).join("~")
        : "",
      finding_location_other: initialData?.finding_location_other ?? "",
      identification_date: initialData?.identification_date
        ? addDays(new Date(initialData.identification_date), 1)
        : new Date(),
      report_date: initialData?.report_date
        ? addDays(new Date(initialData.report_date), 1)
        : new Date(),
      ...(initialData?.reporter_name && { reporter_name: initialData.reporter_name }),
      ...(initialData?.reporter_last_name && { reporter_last_name: initialData.reporter_last_name }),
      ...(initialData?.reporter_email && { reporter_email: initialData.reporter_email }),
      ...(initialData?.reporter_phone && { reporter_phone: initialData.reporter_phone }),
    },
  });

  const findingLocation = form.watch("finding_location");

  const onSubmit = async (data: FormSchemaType) => {
    if (isAnonymous) {
      data.reporter_name = "";
      data.reporter_last_name = "";
      data.reporter_email = "";
      data.reporter_phone = "";
    }

    if (initialData && isEditing) {
      const value = {
        company: companySlug,
        id: initialData.id.toString(),
        data: {
          ...data,
          status: initialData.status ?? "ABIERTO",
          danger_identification_id: initialData.danger_identification_id ?? null,
          danger_type: initialData.danger_type ?? "",
          recommendations: initialData.recommendations ?? "",
          possible_consequences:
            typeof data.possible_consequences === "string"
              ? data.possible_consequences.split("~").map((s) => s.trim()).filter(Boolean)
              : [],
        },
      };
      await updateVoluntaryReport.mutateAsync(value);
    } else {
      const value = {
        company: companySlug,
        reportData: {
          ...data,
          location_id: selectedStation,
          status: (shouldEnableField ? "ABIERTO" : "PROCESO") as "ABIERTO" | "PROCESO" | "CERRADO",
          is_anonymous: isAnonymous,
          danger_type: "",
          recommendations: "",
          identification_date: data.identification_date.toISOString().split("T")[0],
          report_date: data.report_date.toISOString().split("T")[0],
          possible_consequences:
            typeof data.possible_consequences === "string"
              ? data.possible_consequences.split("~").map((s) => s.trim()).filter(Boolean)
              : [],
        },
      };
      try {
        const response = await createVoluntaryReport.mutateAsync(value);
        if (shouldEnableField) {
          router.push(
            `/${companySlug}/sms/reportes/reportes_voluntarios/${response.voluntary_report_id}`
          );
        } else {
          router.push(`/${companySlug}/dashboard`);
        }
      } catch (error) {
        console.error("Error al crear el reporte:", error);
      }
    }
    onClose();
  };

  const isPending = createVoluntaryReport.isPending || updateVoluntaryReport.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col w-full max-w-4xl mx-auto">
        {/* Header strip */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 mb-3 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700 dark:text-amber-400">
                {isEditing ? "Modo edición" : "Nuevo reporte"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-background/60 border border-amber-500/20 rounded px-2.5 py-1">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Reporte Voluntario · SIGEAC
              </span>
            </div>
          </div>
        </div>

        {/* Section 01 — Identificación */}
        <Section num="01" icon={MapPin} title="Identificación y Ubicación">
          <div className="space-y-3">
            {shouldEnableField && (
              <FormField
                control={form.control}
                name="report_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      <Hash className="inline w-3 h-3 mr-1 text-amber-500/70" />
                      Código del Reporte
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número"
                        {...field}
                        maxLength={4}
                        className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50 font-mono"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="station"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Base / Estación
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm border-border focus:ring-amber-500/30 focus:border-amber-500/50">
                          <SelectValue placeholder="Seleccionar" />
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

              <FormField
                control={form.control}
                name="finding_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Lugar de Identificación
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm border-border focus:ring-amber-500/30 focus:border-amber-500/50">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HANGAR">HANGAR</SelectItem>
                        <SelectItem value="PLATAFORMA">PLATAFORMA</SelectItem>
                        <SelectItem value="AREA_ADMON">AREA ADMON</SelectItem>
                        <SelectItem value="AERONAVE">AERONAVE</SelectItem>
                        <SelectItem value="AEROPUERTO">AEROPUERTO</SelectItem>
                        <SelectItem value="OTRO">OTRO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {findingLocation === "OTRO" && (
              <FormField
                control={form.control}
                name="finding_location_other"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Especificar otro lugar
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describa el lugar"
                        {...field}
                        className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            )}
          </div>
        </Section>

        {/* Section 02 — Fechas */}
        <Section num="02" icon={CalendarIcon} title="Fechas">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="identification_date"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <DateField
                      value={field.value}
                      onChange={field.onChange}
                      label="Fecha de Identificación"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="report_date"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <DateField
                      value={field.value}
                      onChange={field.onChange}
                      label="Fecha de Reporte"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* Section 03 — Descripción */}
        <Section num="03" icon={FileText} title="Descripción del Peligro">
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Descripción del peligro
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Breve descripción del peligro identificado"
                      {...field}
                      className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="possible_consequences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Consecuencias según su criterio
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Si son varias, separar por una coma (,)"
                      {...field}
                      className="text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50 resize-none min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* Section 04 — Reportante */}
        <Section num="04" icon={User} title="Datos del Reportante">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 rounded-md border border-border bg-muted/20 px-3 py-2.5">
              <Checkbox
                id="anonymous-check"
                checked={isAnonymous}
                onCheckedChange={(checked) => {
                  if (typeof checked === "boolean") setIsAnonymous(checked);
                }}
                className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
              <label
                htmlFor="anonymous-check"
                className="text-[11px] font-medium cursor-pointer text-foreground/80 select-none"
              >
                Reporte anónimo — no adjuntar datos personales
              </label>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="reporter_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Nombre
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre de quien reporta"
                          {...field}
                          className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reporter_last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Apellido
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Apellido de quien reporta"
                          {...field}
                          className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                        />
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
                      <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Correo electrónico
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ejemplo@gmail.com"
                          {...field}
                          className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                        />
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
                      <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Teléfono
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="04XXXXXXXXX"
                          {...field}
                          className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50 font-mono"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </Section>

        {/* Section 05 — Archivos */}
        <Section num="05" icon={Paperclip} title="Archivos Adjuntos">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Imagen (JPG / PNG)
                  </FormLabel>
                  <FormControl>
                    <div
                      className={cn(
                        "relative rounded-md border border-dashed transition-colors",
                        field.value instanceof File || initialData?.image
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "border-border hover:border-amber-500/30 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5 py-4 px-3 pointer-events-none">
                        {field.value instanceof File ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
                            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 text-center truncate max-w-full">
                              {field.value.name}
                            </span>
                          </>
                        ) : initialData?.image ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
                            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                              Imagen existente
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Clic para reemplazar
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-muted-foreground/60" />
                            <span className="text-[11px] text-muted-foreground text-center">
                              Seleccionar imagen
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              JPEG / PNG · máx. 5MB
                            </span>
                          </>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/jpeg, image/png"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => field.onChange(e.target.files?.[0])}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
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
                  <FormControl>
                    <div
                      className={cn(
                        "relative rounded-md border border-dashed transition-colors",
                        field.value instanceof File || initialData?.document
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "border-border hover:border-amber-500/30 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5 py-4 px-3 pointer-events-none">
                        {field.value instanceof File ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
                            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 text-center truncate max-w-full">
                              {field.value.name}
                            </span>
                          </>
                        ) : initialData?.document ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
                            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                              Documento existente
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Clic para reemplazar
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-muted-foreground/60" />
                            <span className="text-[11px] text-muted-foreground text-center">
                              Seleccionar PDF
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              PDF · máx. 5MB
                            </span>
                          </>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="application/pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => field.onChange(e.target.files?.[0])}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* Actions */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/acceso_publico/estelar/sms")}
              className="rounded-none h-10 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Volver
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-none h-10 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-amber-950 border-0"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Enviar Reporte"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
