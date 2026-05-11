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
import { useGetSmsStations } from "@/hooks/sms/useGetSmsStations";
import { useGetFindingLocations } from "@/hooks/sms/useGetFindingLocations";
import { useGetSmsAreas } from "@/hooks/sms/useGetSmsAreas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateSmsStationForm } from "@/components/forms/sms/CreateSmsStationForm";
import { CreateFindingLocationForm } from "@/components/forms/sms/CreateFindingLocationForm";
import { CreateSmsAreaForm } from "@/components/forms/sms/CreateSmsAreaForm";

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
  const [isAnonymous, setIsAnonymous] = useState(initialData ? (initialData.is_anonymous ?? true) : true);
  const router = useRouter();
  const [consequences, setConsequences] = useState<string[]>([]);
  const [newConsequence, setNewConsequence] = useState("");

  const { user } = useAuth();

  const userRoles = user?.roles?.map((role) => role.name) || [];

  const shouldEnableField = userRoles.some((role) =>
    ["SUPERUSER", "ANALISTA_SMS", "JEFE_SMS"].includes(role),
  );

  const { data: nextNumberData, isPending: isLoadingNextNumber } =
    useGetNextReportNumber(selectedCompany?.slug || null);

  const { data: stations, isLoading: isLoadingStations } = useGetSmsStations(selectedCompany?.slug);
  const { data: findingLocations, isLoading: isLoadingLocations } = useGetFindingLocations(selectedCompany?.slug);
  const { data: smsAreas, isLoading: isLoadingAreas } = useGetSmsAreas(selectedCompany?.slug);

  const [openCreateStation, setOpenCreateStation] = useState(false);
  const [openCreateLocation, setOpenCreateLocation] = useState(false);
  const [openCreateArea, setOpenCreateArea] = useState(false);

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

    sms_station_id: z.number().optional(),
    sms_finding_location_id: z.number().optional(),
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
      sms_area_id: z.number().optional(),
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
    is_anonymous: z.boolean(),
    source_reference: z
      .string()
      .regex(/^\d*$/, { message: "Solo se permiten números" })
      .optional(),
  });

  type FormSchemaType = z.infer<typeof FormSchema>;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      report_number: (initialData?.report_number && initialData.report_number !== "N/A") ? initialData.report_number : "",
      sms_station_id: (initialData as any)?.sms_station_id || undefined,
      description: initialData?.description || "",
      possible_consequences: Array.isArray(initialData?.possible_consequences)
        ? (initialData.possible_consequences as string[])
        : initialData?.possible_consequences
          ? (initialData.possible_consequences as string).split("~").filter((item) => item.trim() !== "")
          : [],
      recommendations: initialData?.recommendations || "",
      sms_finding_location_id: (initialData as any)?.sms_finding_location_id || undefined,
      finding_location_other: initialData?.finding_location_other || "",
      danger_type: initialData?.danger_type || "",
      is_anonymous: initialData?.is_anonymous ?? true,
      source_reference: (initialData as any)?.source_reference?.toString() || "",
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
      ...((initialData as any)?.sms_area_id && {
        sms_area_id: (initialData as any).sms_area_id,
      }),
      ...(initialData?.reporter_position && {
        reporter_position: initialData.reporter_position,
      }),
    },
  });

  const selectedFindingLocationId = form.watch("sms_finding_location_id");
  const selectedFindingLocation = findingLocations?.find(l => l.id === selectedFindingLocationId);
  const isOtherLocation = selectedFindingLocation?.name?.toUpperCase() === 'OTRO';

  useEffect(() => {
    if (initialData && isEditing) {
      const anonymous = initialData.is_anonymous ?? true;
      setIsAnonymous(anonymous);
      form.setValue("is_anonymous", anonymous);

      // Inicializar las consecuencias si hay datos iniciales
      if (initialData.possible_consequences) {
        const initialConsequences = Array.isArray(initialData.possible_consequences)
          ? (initialData.possible_consequences as string[])
          : (initialData.possible_consequences as string).split("~").filter(Boolean);
        setConsequences(initialConsequences);
      }

      if (initialData.report_number && initialData.report_number !== "N/A") {
        form.setValue("report_number", initialData.report_number);
      } else if (nextNumberData?.next_number) {
        form.setValue("report_number", String(nextNumberData.next_number));
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
      const {
        is_anonymous: _ia,
        sms_area_id: _sa,
        reporter_position: _rp,
        ...rest
      } = data;
      const value = {
        company: selectedCompany!.slug,
        id: initialData.id.toString(),
        data: {
          ...rest,
          status: initialData.status ?? "",
          danger_identification_id: initialData.danger_identification_id ?? null,
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
    <>
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
                name="sms_station_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Estación</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => setOpenCreateStation(true)}
                      >
                        <Plus className="h-3 w-3" />
                        Nueva
                      </Button>
                    </div>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value?.toString()}
                      disabled={isLoadingStations}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingStations ? "Cargando..." : "Seleccionar estación"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stations?.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name}
                          </SelectItem>
                        ))}
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
                name="sms_finding_location_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Lugar de Identificación</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => setOpenCreateLocation(true)}
                      >
                        <Plus className="h-3 w-3" />
                        Nuevo
                      </Button>
                    </div>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value?.toString()}
                      disabled={isLoadingLocations}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingLocations ? "Cargando..." : "Seleccionar"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {findingLocations?.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id.toString()}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isOtherLocation && (
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
              name="source_reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia de la Fuente</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Número de referencia"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
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
                  if (typeof checked === "boolean") {
                    setIsAnonymous(checked);
                    form.setValue("is_anonymous", checked);
                  }
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
                    name="sms_area_id"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Área</FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 gap-1 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => setOpenCreateArea(true)}
                          >
                            <Plus className="h-3 w-3" />
                            Nueva
                          </Button>
                        </div>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          value={field.value?.toString()}
                          disabled={isLoadingAreas}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingAreas ? "Cargando..." : "Seleccionar área"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {smsAreas?.map((area) => (
                              <SelectItem key={area.id} value={area.id.toString()}>
                                {area.name}
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

    <Dialog open={openCreateStation} onOpenChange={setOpenCreateStation}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva Estación</DialogTitle>
          <DialogDescription>La estación quedará disponible en el selector.</DialogDescription>
        </DialogHeader>
        <CreateSmsStationForm onClose={() => setOpenCreateStation(false)} />
      </DialogContent>
    </Dialog>

    <Dialog open={openCreateLocation} onOpenChange={setOpenCreateLocation}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo Lugar de Identificación</DialogTitle>
          <DialogDescription>El lugar quedará disponible en el selector.</DialogDescription>
        </DialogHeader>
        <CreateFindingLocationForm onClose={() => setOpenCreateLocation(false)} />
      </DialogContent>
    </Dialog>

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
