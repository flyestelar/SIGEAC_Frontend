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
import { CalendarIcon, FileText, Loader2, MapPin, AlertTriangle, User, Paperclip, Send } from "lucide-react";
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
    <div className="border border-border rounded-lg overflow-hidden mb-3">
      <div className="flex items-center gap-2 px-3.5 py-2 bg-muted/50 border-b border-border">
        <span className="text-[11px] font-semibold text-amber-500 tracking-[0.05em] min-w-[20px]">{num}</span>
        <Icon className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">{title}</span>
      </div>
      <div className="p-3.5 bg-background">{children}</div>
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
      <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground block">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9 text-sm",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-50" />
            {value ? format(value, "PPP", { locale: es }) : "Seleccione fecha"}
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-0 w-full">

        {/* ── Alert badge ── */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-lg mb-4 dark:bg-amber-950/30 dark:border-amber-800">
          <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-200 dark:ring-amber-800 flex-shrink-0" />
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-amber-800 dark:text-amber-300">
            {isEditing ? "Editando reporte" : "Nuevo reporte obligatorio de suceso"}
          </span>
          {form.watch("report_number") && (
            <span className="ml-auto text-[13px] font-semibold text-amber-700 dark:text-amber-300">
              ROS-{form.watch("report_number")}
            </span>
          )}
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
                    <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground block mb-1">Código del Reporte</span>
                    <div className="flex items-center h-9 border border-border rounded-md bg-muted/30 overflow-hidden">
                      <span className="px-2.5 border-r border-border text-[13px] font-semibold text-amber-500 bg-amber-50 dark:bg-amber-950/30 h-full flex items-center">
                        ROS-
                      </span>
                      <span className="px-2.5 text-sm font-semibold text-foreground flex-1 flex items-center">
                        {isLoadingNextNumber
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                          : (field.value || "···")}
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
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">N° de Referencia</FormLabel>
                  <FormControl>
                    <Input placeholder="Referencia" className="h-9 text-sm" {...field} />
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
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Estación</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
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
        <Section num="02" icon={CalendarIcon} title="Fechas">
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
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Lugar</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HANGAR">HANGAR</SelectItem>
                      <SelectItem value="PLATAFORMA">PLATAFORMA</SelectItem>
                      <SelectItem value="AREA_ADMON">ÁREA ADMON</SelectItem>
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
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Especificación</FormLabel>
                  <FormControl>
                    <Input placeholder="Otro lugar..." className="h-9 text-sm" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
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
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Tipo de Peligro</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
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
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Descripción del Suceso</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describa el suceso con el mayor detalle posible..."
                      className="min-h-[90px] text-sm resize-none"
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
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" className="h-9 text-sm" {...field} />
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
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Correo</FormLabel>
                  <FormControl>
                    <Input placeholder="correo@ejemplo.com" className="h-9 text-sm" {...field} />
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
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Teléfono" className="h-9 text-sm" {...field} />
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
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Área</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
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
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Cargo</FormLabel>
                  <FormControl>
                    <Input placeholder="Cargo del reportero" className="h-9 text-sm" {...field} />
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
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Imagen (JPEG / PNG · 10MB)</FormLabel>
                  <div className="border border-dashed border-border rounded-md p-2.5 flex flex-col gap-2">
                    {(field.value instanceof File || initialData?.image) && (
                      <div className="w-14 h-14 rounded-md border border-border overflow-hidden">
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
                    )}
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        className="h-8 text-xs cursor-pointer file:text-xs file:font-medium"
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
            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Documento (PDF · 10MB)</FormLabel>
                  <div className="border border-dashed border-border rounded-md p-2.5 flex flex-col gap-2">
                    {field.value instanceof File ? (
                      <p className="text-xs text-muted-foreground">{field.value.name}</p>
                    ) : initialData?.document ? (
                      <a
                        href={initialData.document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-600 hover:underline"
                      >
                        Ver documento actual
                      </a>
                    ) : null}
                    <FormControl>
                      <Input
                        type="file"
                        accept="application/pdf"
                        className="h-8 text-xs cursor-pointer file:text-xs file:font-medium"
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
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 bg-amber-400 hover:bg-amber-500 text-amber-950 font-semibold tracking-wide uppercase text-sm mt-1"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" />
              {isEditing ? "Actualizar Reporte" : "Enviar Reporte"}
            </>
          )}
        </Button>

      </form>
    </Form>
  );
}
