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
  useCreateDangerIdentification,
  useUpdateDangerIdentification,
} from "@/actions/sms/peligros_identificados/actions";
import { Calendar } from "@/components/ui/calendar";
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
import { useGetInformationSources } from "@/hooks/sms/useGetInformationSource";
import { cn } from "@/lib/utils";
import { useCompanyStore } from "@/stores/CompanyStore";
import { DangerIdentification } from "@/types";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateInformationSourceForm } from "@/components/forms/sms/CreateInformationSourceForm";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const FormSchema = z.object({
  danger: z
    .string()
    .min(3, { message: "El peligro debe tener al menos 3 caracteres" })
    .max(1000, { message: "El peligro no debe exceder los 245 caracteres" }),
  danger_area: z.string(),
  risk_management_start_date: z
    .date()
    .refine((val) => !isNaN(val.getTime()), { message: "Invalid Date" }),
  current_defenses: z
    .string()
    .min(3, {
      message: "Las defensas actuales deben tener al menos 3 caracteres",
    })
    .max(1000, {
      message: "Las defensas actuales no deben exceder los 245 caracteres",
    }),
  description: z
    .string()
    .min(3, { message: "La descripcion debe tener al menos 3 caracteres" })
    .max(1000, { message: "La descripcion no debe exceder los 245 caracteres" }),
  possible_consequences: z
    .string()
    .min(3, {
      message: "Las posibles consecuencias deben tener al menos 3 caracteres",
    })
    .max(1000, {
      message: "Las posibles consecuencias no deben exceder los 245 caracteres",
    }),
  consequence_to_evaluate: z
    .string()
    .min(3, {
      message: "La consecuencia a evaluar debe tener al menos 3 caracteres",
    })
    .max(1000, {
      message: "La consecuencia a evaluar no debe exceder los 245 caracteres",
    }),
  danger_type: z.string().min(1, "Este campo es obligatorio"),
  root_cause_analysis: z
    .string()
    .min(3, {
      message: "El analisis causa raiz debe tener al menos 3 caracteres",
    })
    .max(900, {
      message: "El analisis causa raiz no debe exceder los 900 caracteres",
    }),
  information_source_id: z.string(),
});

type FormSchemaType = z.infer<typeof FormSchema>;

interface FormProps {
  id: number | string;
  initialData?: DangerIdentification;
  isEditing?: boolean;
  reportType: string;
  onClose?: () => void;
}

export default function CreateDangerIdentificationForm({
  onClose,
  id,
  isEditing,
  initialData,
  reportType,
}: FormProps) {
  const { selectedCompany } = useCompanyStore();
  const { data: informationSources, isLoading: isLoadingSources } =
    useGetInformationSources(selectedCompany?.slug);
  const { createDangerIdentification } = useCreateDangerIdentification();
  const { updateDangerIdentification } = useUpdateDangerIdentification();
  const router = useRouter();

  const [defenses, setDefenses] = useState<string[]>([]);
  const [newDefense, setNewDefense] = useState("");

  const [consequences, setConsequences] = useState<string[]>([]);
  const [newConsequence, setNewConsequence] = useState("");

  const [analyses, setAnalyses] = useState<string[]>([]);
  const [newAnalysis, setNewAnalysis] = useState("");

  const [openCreateSource, setOpenCreateSource] = useState(false);

  const AREAS = [
    "ANONIMO",
    "APTO",
    "DISPATCH",
    "GSE",
    "GTE. EST.",
    "SUMINISTRO",
    "INAC",
    "MTTO",
    "ING",
    "INST. CAP",
    "N/A",
    "OMA",
    "OPS",
    "QMS",
    "RR.HH",
    "SGC",
    "SMS",
    "TDC",
    "TDM",
    "TFC",
    "CARG",
    "QMS_AVSEC",
    "GTE_EQUIPAJE",
    "TALLER_SUPERVIVENCIA",
    "NDT",
    "AUDITORIA_INTERNA",
    "AEROPUERTO",
    "SSL",
    "TECNOLOGIA",
    "INFRAESTRUCTURA",
    "AVSEC",
  ];
  const DANGER_TYPES = ["ORGANIZACIONAL", "TECNICO", "HUMANO", "NATURAL"];

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      danger: initialData?.danger || "",
      information_source_id:
        initialData?.information_source?.id.toString() || "",
      current_defenses: initialData?.current_defenses || "",
      risk_management_start_date: initialData?.risk_management_start_date
        ? addDays(new Date(initialData.risk_management_start_date), 1)
        : new Date(),
      consequence_to_evaluate: initialData?.consequence_to_evaluate || "",
      danger_area: initialData?.danger_area || "",
      danger_type: initialData?.danger_type || "",
      root_cause_analysis: initialData?.root_cause_analysis || "",
      description: initialData?.description || "",
      possible_consequences: initialData?.possible_consequences || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      const splitAndFilter = (str: string | undefined) =>
        str
          ? str
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      setDefenses(splitAndFilter(initialData.current_defenses));
      setConsequences(splitAndFilter(initialData.possible_consequences));
      setAnalyses(splitAndFilter(initialData.root_cause_analysis));
    }
  }, [initialData]);

  // --- DEFENSAS ---
  const addDefense = () => {
    if (newDefense.trim()) {
      const updated = [...defenses, newDefense.trim()];
      setDefenses(updated);
      form.setValue("current_defenses", updated.join(","));
      setNewDefense("");
    }
  };
  const removeDefense = (index: number) => {
    const updated = defenses.filter((_, i) => i !== index);
    setDefenses(updated);
    form.setValue("current_defenses", updated.join(","));
  };
  const handleDefenseKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addDefense();
    }
  };

  // --- CONSECUENCIAS ---
  const addConsequence = () => {
    if (newConsequence.trim()) {
      const updated = [...consequences, newConsequence.trim()];
      setConsequences(updated);
      form.setValue("possible_consequences", updated.join(","));
      setNewConsequence("");
    }
  };
  const removeConsequence = (index: number) => {
    const updated = consequences.filter((_, i) => i !== index);
    setConsequences(updated);
    form.setValue("possible_consequences", updated.join(","));
  };
  const handleConsequenceKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addConsequence();
    }
  };

  // --- ANÁLISIS ---
  const addAnalysis = () => {
    if (newAnalysis.trim()) {
      const updated = [...analyses, newAnalysis.trim()];
      setAnalyses(updated);
      form.setValue("root_cause_analysis", updated.join(","));
      setNewAnalysis("");
    }
  };
  const removeAnalysis = (index: number) => {
    const updated = analyses.filter((_, i) => i !== index);
    setAnalyses(updated);
    form.setValue("root_cause_analysis", updated.join(","));
  };
  const handleAnalysisKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAnalysis();
    }
  };

  // --- ENVÍO ---
  const onSubmit = async (data: FormSchemaType) => {
    try {
      if (initialData && isEditing) {
        // Actualización
        await updateDangerIdentification.mutateAsync({
          company: selectedCompany!.slug,
          id: initialData.id.toString(),
          data,
        });
        onClose?.();
      } else {
        // Creación
        const response = await createDangerIdentification.mutateAsync({
          company: selectedCompany!.slug,
          id, // id del reporte padre
          reportType,
          data,
        });

        const newId = response.danger_identification_id;

        if (!newId) {
          throw new Error("No se recibió el id de la identificación creada");
        }

        router.push(
          `/${selectedCompany?.slug}/sms/gestion_reportes/peligros_identificados/${response.danger_identification_id}`
        );
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
    }

  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2">
      <span className="border-l-2 border-amber-500 pl-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </span>
      <div className="flex-1 border-t border-dashed border-border" />
    </div>
  );

  const fieldLabel = "text-[11px] font-semibold uppercase tracking-widest text-muted-foreground";

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* SECCIÓN: IDENTIFICACIÓN */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Identificación" />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="danger"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={fieldLabel}>Peligro Identificado</FormLabel>
                  <FormControl>
                    <Input placeholder="¿Cuál es el peligro?" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="risk_management_start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={fieldLabel}>Fecha Inicio de Gestión</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-medium text-sm",
                            !field.value && "text-muted-foreground font-normal"
                          )}
                        >
                          {field.value
                            ? format(field.value, "PPP", { locale: es })
                            : "Seleccione una fecha"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-40" />
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
                        captionLayout="dropdown-buttons"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={fieldLabel}>Descripción</FormLabel>
                <FormControl>
                  <Textarea className="resize-none text-sm min-h-[72px]" placeholder="Breve descripción del peligro identificado" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="danger_area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={fieldLabel}>Área</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar área..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AREAS.map((area, index) => (
                        <SelectItem key={index} value={area}>
                          {area}
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
              name="danger_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={fieldLabel}>Tipo de Peligro</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-medium text-sm">
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DANGER_TYPES.map((type, index) => (
                        <SelectItem key={index} value={type} className="font-medium">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="information_source_id"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-stretch gap-2">
                  <FormLabel className={fieldLabel}>Método de Identificación</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    onClick={() => setOpenCreateSource(true)}
                  >
                    <Plus className="h-3 w-3" />
                    Nueva fuente
                  </Button>
                </div>
                {isLoadingSources ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando fuentes...</span>
                  </div>
                ) : (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingSources}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar fuente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {informationSources?.map((source) => (
                        <SelectItem key={source.id} value={source.id.toString()}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        {/* SECCIÓN: DEFENSAS */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Defensas Actuales" />
          <FormItem>
            <div className="flex gap-2">
              <Input
                className="text-sm"
                placeholder="Escriba una defensa y presione +"
                value={newDefense}
                onChange={(e) => setNewDefense(e.target.value)}
                onKeyPress={handleDefenseKeyPress}
              />
              <Button type="button" onClick={addDefense} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {defenses.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {defenses.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 bg-muted/50 border rounded-md px-2.5 py-1">
                    <span className="text-xs font-medium">{item}</span>
                    <button type="button" onClick={() => removeDefense(index)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormItem>
          <FormField
            control={form.control}
            name="current_defenses"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl><Input type="hidden" {...field} /></FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* SECCIÓN: CONSECUENCIAS */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Consecuencias" />
          <FormItem>
            <FormLabel className={fieldLabel}>Posibles Consecuencias</FormLabel>
            <div className="flex gap-2">
              <Input
                className="text-sm"
                placeholder="Escriba una consecuencia y presione +"
                value={newConsequence}
                onChange={(e) => setNewConsequence(e.target.value)}
                onKeyPress={handleConsequenceKeyPress}
              />
              <Button type="button" onClick={addConsequence} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {consequences.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {consequences.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 bg-muted/50 border rounded-md px-2.5 py-1">
                    <span className="text-xs font-medium">{item}</span>
                    <button type="button" onClick={() => removeConsequence(index)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormItem>
          <FormField
            control={form.control}
            name="possible_consequences"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl><Input type="hidden" {...field} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="consequence_to_evaluate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={fieldLabel}>Consecuencia a Evaluar</FormLabel>
                {consequences.length === 0 ? (
                  <div className="flex h-9 w-full items-center rounded-md border border-dashed border-amber-400 bg-amber-50/50 px-3 text-xs text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                    Debe agregar al menos una consecuencia primero
                  </div>
                ) : (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar consecuencia a evaluar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {consequences.filter(Boolean).map((c, idx) => (
                        <SelectItem key={idx} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* SECCIÓN: ANÁLISIS CAUSA RAÍZ */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Análisis Causa Raíz" />
          <FormItem>
            <div className="flex gap-2">
              <Input
                className="text-sm"
                placeholder="Escriba un 'porqué' del análisis y presione +"
                value={newAnalysis}
                onChange={(e) => setNewAnalysis(e.target.value)}
                onKeyPress={handleAnalysisKeyPress}
              />
              <Button type="button" onClick={addAnalysis} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {analyses.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-2">
                {analyses.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 bg-muted/50 border rounded-md px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground">#{index + 1}</span>
                      <span className="text-sm">{item}</span>
                    </div>
                    <button type="button" onClick={() => removeAnalysis(index)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormItem>
          <FormField
            control={form.control}
            name="root_cause_analysis"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl><Input type="hidden" {...field} /></FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={createDangerIdentification.isPending || updateDangerIdentification.isPending}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold tracking-wide transition-colors"
        >
          {(createDangerIdentification.isPending || updateDangerIdentification.isPending) ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isEditing ? "Guardar cambios" : "Enviar"}
        </Button>
      </form>
    </Form>

    <Dialog open={openCreateSource} onOpenChange={setOpenCreateSource}>
      <DialogContent className="flex flex-col max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Fuente de Identificación</DialogTitle>
          <DialogDescription>
            Crea una nueva fuente y aparecerá disponible en el selector.
          </DialogDescription>
        </DialogHeader>
        <CreateInformationSourceForm onClose={() => setOpenCreateSource(false)} />
      </DialogContent>
    </Dialog>
    </>
  );
}
