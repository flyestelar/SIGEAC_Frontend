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
  useGetNextReportNumber,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { VoluntaryReportResource } from "@/.gen/api/types.gen";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { useCompanyStore } from "@/stores/CompanyStore";

interface FormProps {
  onClose: () => void;
  initialData?: VoluntaryReportResource;
  isEditing?: boolean;
}

export function CreateVoluntaryReportForm({
  onClose,
  isEditing,
  initialData,
}: FormProps) {
  const { selectedCompany } = useCompanyStore();
  const { createVoluntaryReport } = useCreateVoluntaryReport();
  const { updateVoluntaryReport } = useUpdateVoluntaryReport();
  const [isAnonymous, setIsAnonymous] = useState(true);
  const router = useRouter();
  const [consequences, setConsequences] = useState<string[]>([]);
  const [newConsequence, setNewConsequence] = useState("");

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { user } = useAuth();

  const userRoles = user?.roles?.map((role) => role.name) || [];

  const shouldEnableField = userRoles.some((role) =>
    ["SUPERUSER", "ANALISTA_SMS", "JEFE_SMS"].includes(role),
  );

  const { data: nextNumberData, isPending: isLoadingNextNumber } =
    useGetNextReportNumber(selectedCompany?.slug || null);

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
    danger_type: z.string(),
    description: z
      .string()
      .min(3, {
        message: "La descripción debe tener al menos 3 caracteres",
      })
      .max(900, {
        message: "La descripción no debe exceder los 900 caracteres",
      }),
    possible_consequences: z.array(z.string()),
    recommendations: z
      .string()
      .min(3, {
        message: "Las recomendaciones deben tener al menos 3 caracteres",
      })
      .max(999, {
        message: "Las recomendaciones no deben exceder los 999 caracteres",
      }),

    reporter_name: z
      .string()
      .min(3, {
        message: "El nombre de quien reporta debe tener al menos 3 letras.",
      })
      .max(40)
      .optional(),
    reporter_last_name: z
      .string()
      .min(3, {
        message: "El Apellido de quien reporta debe tener al menos 3 letras.",
      })
      .max(40)
      .optional(),
    reporter_phone: z
      .string()
      .regex(/^\d{11}$/, {
        message: "El número telefónico debe tener almenos 11 dígitos",
      })
      .optional(),

    reporter_email: z
      .string()
      .min(10, {
        message: "El correo electrónico debe tener al menos 10 caracteres",
      })
      .email({ message: "Formato de correo electrónico inválido" })
      .optional(),
      reporter_area: z.string().optional(),
      reporter_position: z.string().optional(),
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
    is_anonymous: z.boolean()
  });

  type FormSchemaType = z.infer<typeof FormSchema>;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      report_number: initialData?.report_number || "",
      station: initialData?.station || "",
      description: initialData?.description || "",
      possible_consequences: Array.isArray(initialData?.possible_consequences)
        ? initialData.possible_consequences
        : initialData?.possible_consequences
          ? initialData.possible_consequences.split("~").filter((item) => item.trim() !== "")
          : [],
      recommendations: initialData?.recommendations || "",
      finding_location: initialData?.finding_location || "",
      finding_location_other: initialData?.finding_location_other || "",
      danger_type: initialData?.danger_type || "",
      is_anonymous: initialData ? !initialData.is_anonymous : true,
      identification_date: initialData?.identification_date
        ? addDays(new Date(initialData.identification_date), 1)
        : new Date(),

      report_date: initialData?.report_date
        ? addDays(new Date(initialData.report_date), 1)
        : new Date(),

      // Campos del reporter - solo se asignan si existen en initialData
      ...(initialData?.reporter_name && {
        reporter_name: initialData.reporter_name,
      }),
      ...(initialData?.reporter_last_name && {
        reporter_last_name: initialData.reporter_last_name,
      }),
      ...(initialData?.reporter_email && {
        reporter_email: initialData.reporter_email,
      }),
      ...(initialData?.reporter_phone && {
        reporter_phone: initialData.reporter_phone,
      }),
      ...(initialData?.reporter_area && {
        reporter_area: initialData.reporter_area,
      }),
      ...(initialData?.reporter_position && {
        reporter_position: initialData.reporter_position,
      }),
    },
  });

  const findingLocation = form.watch("finding_location");

  useEffect(() => {
    if (initialData && isEditing) {
      if (
        initialData.reporter_email &&
        initialData.reporter_name &&
        initialData.reporter_last_name &&
        initialData.reporter_phone
      ) {
        setIsAnonymous(false);
      }

      // Inicializar las consecuencias si hay datos iniciales
      if (initialData.possible_consequences) {
        const initialConsequences = Array.isArray(initialData.possible_consequences)
          ? initialData.possible_consequences
          : initialData.possible_consequences.split("~");
        setConsequences(initialConsequences);
      }

      if (initialData.report_number) {
        form.setValue("report_number", initialData.report_number);
      }
    } else if (!isEditing && nextNumberData?.next_number) {
      form.setValue("report_number", String(nextNumberData.next_number));
    }
  }, [initialData, isEditing, nextNumberData, form]); // Only run when these values change

  // Agregar una consecuencia
  const addConsequence = () => {
    if (newConsequence.trim() !== "") {
      const updatedConsequences = [...consequences, newConsequence.trim()];
      setConsequences(updatedConsequences);
      setNewConsequence("");
      form.setValue("possible_consequences", updatedConsequences);
    }
  };

  // Eliminar una consecuencia
  const removeConsequence = (index: number) => {
    const updatedConsequences = consequences.filter((_, i) => i !== index);
    setConsequences(updatedConsequences);
    form.setValue("possible_consequences", updatedConsequences);
  };

  // Manejar la tecla Enter en el input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addConsequence();
    }
  };

  const onSubmit = async (data: FormSchemaType) => {
    if (isAnonymous) {
      data.reporter_name = "";
      data.reporter_last_name = "";
      data.reporter_email = "";
      data.reporter_phone = "";
    }

    if (initialData && isEditing) {
      const value = {
        company: selectedCompany!.slug,
        id: initialData.id.toString(),
        data: {
          ...data,
          status: initialData.status ?? "",
          danger_identification_id: initialData?.danger_identification_id,
        },
      };
      await updateVoluntaryReport.mutateAsync(value);
    } else {
      const value = {
        company: selectedCompany!.slug,
        reportData: {
          ...data,
          report_date: data.report_date.toISOString(),
          identification_date: data.identification_date.toISOString(),
          status: (shouldEnableField ? "ABIERTO" : "PROCESO") as "ABIERTO" | "PROCESO" | "CERRADO",
          is_anonymous: (data.is_anonymous ? 1 : 0) as 0 | 1,
        },
      };
      try {
        const response = await createVoluntaryReport.mutateAsync(value);
        if (shouldEnableField) {
          router.push(
            `/${selectedCompany?.slug}/sms/reportes/reportes_voluntarios/${response.voluntary_report_id}`,
          );
        } else {
          router.push(`/${selectedCompany?.slug}/dashboard`);
        }
      } catch (error) {
        console.error("Error al crear el reporte:", error);
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
            Reporte Voluntario de Peligro
          </FormLabel>

          {/* ── Identificación ── */}
          {shouldEnableField && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Identificación
              </p>
              <FormField
                control={form.control}
                name="report_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código del Reporte Voluntario</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center text-muted-foreground cursor-not-allowed select-none">
                        <span className="absolute left-2 select-none pointer-events-none">RPV-</span>
                        <Input
                          {...field}
                          placeholder={isLoadingNextNumber ? "Cargando..." : ""}
                          readOnly
                          tabIndex={-1}
                          className="bg-muted pl-12 font-bold pointer-events-none select-none"
                        />
                        {isLoadingNextNumber && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
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
          )}

          {/* ── Fechas ── */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Fechas
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="identification_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Identificación</FormLabel>
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
                          initialFocus
                          fromYear={2000}
                          toYear={new Date().getFullYear()}
                          captionLayout="dropdown"
                          components={{
                            Dropdown: ({ options, classNames, components: _c, ...props }) => (
                              <select {...props} className="bg-popover text-popover-foreground">
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="report_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Reporte</FormLabel>
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
                          initialFocus
                          fromYear={2000}
                          toYear={new Date().getFullYear()}
                          captionLayout="dropdown"
                          components={{
                            Dropdown: ({ options, classNames, components: _c, ...props }) => (
                              <select {...props} className="bg-popover text-popover-foreground">
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ── Ubicación ── */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Ubicación del Peligro
            </p>
            <div className="grid grid-cols-2 gap-3">
              
              <FormField
                control={form.control}
                name="finding_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lugar de Identificación</FormLabel>
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
                        <SelectItem value="OTRO">OTRO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {findingLocation === "OTRO" && (
                <FormField
                  control={form.control}
                  name="finding_location_other"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Otro Lugar de Identificación</FormLabel>
                      <FormControl>
                        <Input placeholder="Especificar" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
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
                  <FormLabel>Descripción del Peligro</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descripción del peligro"
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Consecuencias según su criterio</FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escriba una consecuencia"
                    value={newConsequence}
                    onChange={(e) => setNewConsequence(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button type="button" onClick={addConsequence} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {consequences.map((consequence, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 p-2 border rounded-md bg-muted/20 text-sm"
                    >
                      <span>{consequence}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeConsequence(index)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <FormMessage className="text-xs" />
            </FormItem>
            <FormField
              control={form.control}
              name="possible_consequences"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recomendaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descripción de las recomendaciones"
                      {...field}
                      className="min-h-[100px]"
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous-report"
                name="is_anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => {
                  if (typeof checked === "boolean") setIsAnonymous(checked);
                }}
              />
              <Label htmlFor="anonymous-report" className="text-sm">
                Reporte anónimo
              </Label>
            </div>
            {!isAnonymous && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="reporter_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de quien reporta" {...field} />
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
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Apellido de quien reporta" {...field} />
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
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="ejemplo@gmail.com" {...field} />
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
                        <Input placeholder="04121234567" {...field} />
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
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Cargo" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            )}
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
                                : initialData!.image!.startsWith("http")
                                  ? initialData!.image!
                                  : `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}${initialData!.image}`
                            }
                            alt="Preview"
                            fill
                            className="object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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
            disabled={createVoluntaryReport.isPending}
          >
            {createVoluntaryReport.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Enviar Reporte"
            )}
          </Button>
      </form>
    </Form>
  );
}
