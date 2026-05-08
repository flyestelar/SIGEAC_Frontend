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

import { useEffect } from "react";

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
import { cn } from "@/lib/utils";
import { useCompanyStore } from "@/stores/CompanyStore";
import { ObligatoryReportResource } from "@/.gen/api/types.gen";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  FileText,
  Loader2,
  MapPin,
  AlertTriangle,
  User,
  Paperclip,
  Send,
  ChevronRight,
  ImageIcon,
  FileIcon,
  CheckCircle2,
} from "lucide-react";
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

/* ── Section wrapper ── */
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
      <div className="flex items-center gap-0 px-0 py-0 bg-muted/40 border-b border-border">
        <div className="flex items-center justify-center w-10 h-full py-2 border-r border-border/60 bg-amber-500/5">
          <span className="font-mono text-[12px] font-bold text-amber-500 tabular-nums">{num}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 flex-1">
          <Icon className="w-3 h-3 text-amber-600/70" />
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">{title}</span>
        </div>
      </div>
      <div className="p-4 bg-background">{children}</div>
    </div>
  );
}

/* ── DatePicker field ── */
function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (d: Date | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground block">
        {label}
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal h-9 text-sm border-border hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors group",
              !value && "text-muted-foreground",
            )}
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
            disabled={(date) => date > new Date()}
            initialFocus
            fromYear={1980}
            toYear={new Date().getFullYear()}
            captionLayout="dropdown"
            components={{
              Dropdown: ({ options, classNames, components: _c, ...props }) => (
                <select {...props} className="bg-popover text-popover-foreground text-sm rounded px-1 py-0.5">
                  {options?.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ),
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ── Field label ── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground block mb-1">
      {children}
    </span>
  );
}

/* ── Main form ── */
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
      report_date: initialData?.report_date ? new Date(initialData.report_date) : new Date(),
      incident_date: initialData?.incident_date ? new Date(initialData.incident_date) : new Date(),
    },
  });

  useEffect(() => {
    if (initialData && isEditing) {
      if (initialData.report_number) form.setValue("report_number", initialData.report_number);
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
          router.push(`/${selectedCompany?.slug}/sms/reportes/reportes_obligatorios/${response.obligatory_report_id}`);
        } else {
          router.push(`/${selectedCompany?.slug}/dashboard`);
        }
      } catch (error) {
        console.error("Error al crear reporte:", error);
      }
    }
    onClose();
  };

  const isPending = createObligatoryReport.isPending || updateObligatoryReport.isPending;
  const reportCode = form.watch("report_number");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-0 w-full">

        {/* ── Header strip ── */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 mb-3 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700 dark:text-amber-400">
                  {isEditing ? "Modo edición" : "Nuevo reporte"}
                </span>
              </div>
              <Separator orientation="vertical" className="h-3.5 bg-amber-500/20" />
              <span className="text-[10px] tracking-wide text-amber-700/70 dark:text-amber-400/70 uppercase font-medium">
                Reporte Obligatorio de Suceso
              </span>
            </div>
            {reportCode && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded px-2.5 py-1">
                <span className="text-[10px] font-semibold text-amber-600/70 dark:text-amber-400/70 tracking-widest">ROS</span>
                <span className="text-[10px] text-amber-500/50">—</span>
                {isLoadingNextNumber ? (
                  <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                ) : (
                  <span className="font-mono text-[13px] font-bold text-amber-600 dark:text-amber-400">{reportCode}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 01 Identificación ── */}
        <Section num="01" icon={FileText} title="Identificación">
          <div className="grid grid-cols-2 gap-3">
            {shouldEnableField && (
              <FormField
                control={form.control}
                name="report_number"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>Código del Reporte</FieldLabel>
                    <div className="flex items-center h-9 border border-border rounded-md bg-muted/20 overflow-hidden">
                      <span className="px-2.5 border-r border-border text-[11px] font-bold text-amber-500 bg-amber-500/10 h-full flex items-center tracking-wider">
                        ROS
                      </span>
                      <span className="px-2.5 font-mono text-sm font-semibold text-foreground flex-1 flex items-center">
                        {isLoadingNextNumber
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                          : (field.value || <span className="text-muted-foreground/50">···</span>)}
                      </span>
                    </div>
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
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                    N° de Referencia
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Referencia"
                      className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="station"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                    Estación
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm border-border focus:ring-amber-500/30">
                        <SelectValue placeholder="Seleccionar estación" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["PZO","MIQ","PMV","MAR","VIG","BNS","STD","STB","MUN","SVSA","MADRID","CHILE","HAVANA","SVZ","CANAIMA","MDPC","LIMA","PTY","SKBO"].map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                      <SelectItem value="N/A">NO APLICA</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ── 02 Fechas ── */}
        <Section num="02" icon={CalendarIcon} title="Fechas del Evento">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="incident_date"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-0">
                  <DateField label="Fecha del Incidente" value={field.value} onChange={field.onChange} />
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="report_date"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-0">
                  <DateField label="Fecha del Reporte" value={field.value} onChange={field.onChange} />
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ── 03 Ubicación ── */}
        <Section num="03" icon={MapPin} title="Ubicación del Incidente">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="incident_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                    Lugar
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm border-border focus:ring-amber-500/30">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HANGAR">HANGAR</SelectItem>
                      <SelectItem value="PLATAFORMA">PLATAFORMA</SelectItem>
                      <SelectItem value="AREA_ADMON">ÁREA ADMON</SelectItem>
                      <SelectItem value="AERONAVE">AERONAVE</SelectItem>
                      <SelectItem value="AEROPUERTO">AEROPUERTO</SelectItem>
                      <SelectItem value="OTRO">OTRO</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("incident_location") === "OTRO" && (
              <FormField
                control={form.control}
                name="incident_location_other"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                      Especificación
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Otro lugar..."
                        className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            )}
          </div>
        </Section>

        {/* ── 04 Clasificación y Descripción ── */}
        <Section num="04" icon={AlertTriangle} title="Clasificación y Descripción">
          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="danger_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                    Tipo de Peligro
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm border-border focus:ring-amber-500/30">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HUMANO">HUMANO</SelectItem>
                      <SelectItem value="ORGANIZACIONAL">ORGANIZACIONAL</SelectItem>
                      <SelectItem value="TECNICOS">TÉCNICOS</SelectItem>
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
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                    Descripción del Suceso
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describa el suceso con el mayor detalle posible..."
                      className="min-h-[90px] text-sm resize-none border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ── 05 Datos del Reportero ── */}
        <Section num="05" icon={User} title="Datos del Reportero">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="reporter_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre completo"
                      className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                      {...field}
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
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Correo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="correo@ejemplo.com"
                      className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                      {...field}
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
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Teléfono"
                      className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                      {...field}
                    />
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
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Área</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm border-border focus:ring-amber-500/30">
                        <SelectValue placeholder="Seleccionar área" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        ["ANONIMO","ANÓNIMO"],["APTO","APTO"],["DISPATCH","DISPATCH"],["GSE","GSE"],
                        ["GTE. EST.","GTE. EST."],["SUMINISTRO","SUMINISTRO"],["INAC","INAC"],
                        ["MTTO","MANTENIMIENTO"],["ING","INGENIERÍA"],["INST. CAP","INST. CAP"],
                        ["N/A","NO APLICA"],["OMA","OMA"],["OPS","OPS"],["QMS","QMS"],
                        ["RR.HH","RECURSOS HUMANOS"],["SGC","SGC"],["SMS","SMS"],
                        ["TDC","TDC"],["TDM","TDM"],["TFC","TFC"],["CARG","CARG"],
                        ["QMS_AVSEC","QMS AVSEC"],["GTE_EQUIPAJE","GTE EQUIPAJE"],
                        ["TALLER_SUPERVIVENCIA","TALLER DE SUPERVIVENCIA"],["NDT","NDT"],
                        ["AUDITORIA_INTERNA","AUDITORÍA INTERNA"],["AEROPUERTO","AEROPUERTO"],
                        ["SSL","SSL"],["TECNOLOGIA","TECNOLOGÍA"],["INFRAESTRUCTURA","INFRAESTRUCTURA"],
                        ["AVSEC","AVSEC"],
                      ].map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
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
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Cargo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Cargo del reportero"
                      className="h-9 text-sm border-border focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ── 06 Archivos Adjuntos ── */}
        <Section num="06" icon={Paperclip} title="Archivos Adjuntos">
          <div className="grid grid-cols-2 gap-3">

            {/* Image upload */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                    Imagen <span className="text-muted-foreground/50 normal-case tracking-normal">JPEG / PNG · 10MB</span>
                  </FormLabel>
                  <div className={cn(
                    "relative rounded-md border border-dashed transition-colors",
                    field.value instanceof File || initialData?.image
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-border hover:border-amber-500/30 hover:bg-muted/30"
                  )}>
                    {(field.value instanceof File || initialData?.image) ? (
                      <div className="flex items-center gap-2.5 p-2.5">
                        <div className="w-10 h-10 rounded border border-border overflow-hidden flex-shrink-0 bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              field.value instanceof File
                                ? URL.createObjectURL(field.value)
                                : initialData!.image!.startsWith("http")
                                  ? initialData!.image!
                                  : `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}${initialData!.image!}`
                            }
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <CheckCircle2 className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              {field.value instanceof File ? "Imagen seleccionada" : "Imagen actual"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {field.value instanceof File ? field.value.name : "Imagen adjunta"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">Seleccionar imagen</span>
                      </div>
                    )}
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) field.onChange(file);
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Document upload */}
            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                    Documento <span className="text-muted-foreground/50 normal-case tracking-normal">PDF · 10MB</span>
                  </FormLabel>
                  <div className={cn(
                    "relative rounded-md border border-dashed transition-colors",
                    field.value instanceof File || initialData?.document
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-border hover:border-amber-500/30 hover:bg-muted/30"
                  )}>
                    {field.value instanceof File ? (
                      <div className="flex items-center gap-2.5 p-2.5">
                        <div className="w-10 h-10 rounded border border-border flex-shrink-0 bg-red-500/10 flex items-center justify-center">
                          <FileIcon className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <CheckCircle2 className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              PDF seleccionado
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{field.value.name}</p>
                        </div>
                      </div>
                    ) : initialData?.document ? (
                      <div className="flex items-center gap-2.5 p-2.5">
                        <div className="w-10 h-10 rounded border border-border flex-shrink-0 bg-red-500/10 flex items-center justify-center">
                          <FileIcon className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <CheckCircle2 className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              Documento actual
                            </span>
                          </div>
                          <a
                            href={initialData.document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-amber-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver documento
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                          <FileIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">Seleccionar PDF</span>
                      </div>
                    )}
                    <FormControl>
                      <Input
                        type="file"
                        accept="application/pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => field.onChange(e.target.files?.[0])}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ── Submit ── */}
        <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/5 overflow-hidden">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-none bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold tracking-[0.12em] uppercase text-[12px] border-0 transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-3.5 w-3.5" />
                {isEditing ? "Actualizar Reporte" : "Enviar Reporte"}
              </span>
            )}
          </Button>
        </div>

      </form>
    </Form>
  );
}
