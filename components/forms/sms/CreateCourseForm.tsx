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
  useCreateCourse,
  useUpdateCourse,
} from "@/actions/general/cursos/actions";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCompanyStore } from "@/stores/CompanyStore";
import { CourseResource } from "@/.gen/api/types.gen";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormProps {
  onClose: (open: boolean) => void;
  initialData?: CourseResource;
  isEditing?: boolean;
  selectedDate?: string;
}
export function CreateCourseForm({
  onClose,
  isEditing,
  initialData,
  selectedDate,
}: FormProps) {
  const { selectedCompany, selectedStation } = useCompanyStore();
  const { createCourse } = useCreateCourse();
  const { updateCourse } = useUpdateCourse();

  const FormSchema = z
    .object({
      name: z.string(),
      description: z.string(),
      course_type: z.string().min(1, "Debes seleccionar un tipo de curso"),
      instructor: z.string().optional(),
      end_date: z
        .date()
        .refine((val) => !isNaN(val.getTime()), { message: "Fecha no válida" }),
      start_date: z
        .date()
        .refine((val) => !isNaN(val.getTime()), { message: "Fecha no válida" }),
      end_time: z.string(),
      start_time: z.string(),
    })
    .refine((data) => data.end_date >= data.start_date, {
      message:
        "La fecha de fin debe ser igual o posterior a la fecha de inicio",
      path: ["end_date"], // Esto hace que el error se muestre en el campo end_date
    });

  type FormSchemaType = z.infer<typeof FormSchema>;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: initialData?.name,
      course_type: initialData?.course_type ?? "",
      description: initialData?.description ?? undefined,
      instructor: initialData?.instructor ?? undefined,

      start_date: initialData?.start_date
        ? addDays(new Date(initialData.start_date), 1)
        : selectedDate
          ? new Date(selectedDate)
          : undefined,

      end_date: initialData?.end_date
        ? addDays(new Date(initialData.end_date), 1)
        : undefined,

      start_time: initialData
        ? (initialData.start_time ?? undefined)
        : selectedDate
          ? selectedDate.split(" ")[1]
          : undefined,

      end_time: initialData
        ? (initialData.end_time ?? undefined)
        : selectedDate
          ? selectedDate.split(" ")[1]
          : undefined,
    },
  });

  const onSubmit = async (data: FormSchemaType) => {
    if (initialData && isEditing) {
      const value = {
        id: initialData.id.toString(),
        company: selectedCompany!.slug,
        data: {
          name: data.name,
          description: data.description,
          instructor: data.instructor,
          start_date: format(data.start_date, 'yyyy-MM-dd'),
          end_date: format(data.end_date, 'yyyy-MM-dd'),
          start_time: data.start_time,
          end_time: data.end_time,
          course_type: data.course_type,
        },
      };
      updateCourse.mutateAsync(value);
    } else {
      try {
        await createCourse.mutateAsync({
          company: selectedCompany!.slug,
          location_id: selectedStation!,
          course: {
            ...data,
            start_date: format(data.start_date, 'yyyy-MM-dd'),
            end_date: format(data.end_date, 'yyyy-MM-dd'),
          },
        });
      } catch (error) {
        console.error("Error al crear el curso:", error);
      }
    }
    onClose(false);
  };

  const isPending = createCourse.isPending || updateCourse.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* SECCIÓN: IDENTIFICACIÓN */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="border-l-2 border-amber-500 pl-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Identificación
            </span>
            <div className="flex-1 border-t border-dashed border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Nombre del Curso
                  </FormLabel>
                  <FormControl>
                    <Input className="font-medium" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="course_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Tipo de Curso
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-mono text-sm">
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RECURRENTE" className="font-mono">RECURRENTE</SelectItem>
                      <SelectItem value="INICIAL" className="font-mono">INICIAL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECCIÓN: PERÍODO */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="border-l-2 border-amber-500 pl-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Período
            </span>
            <div className="flex-1 border-t border-dashed border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Fecha Inicio
                  </FormLabel>
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
                            ? format(field.value, "dd MMM yyyy", { locale: es })
                            : "dd / mm / aaaa"}
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
                        fromYear={1988}
                        toYear={new Date().getFullYear() + 5}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Fecha Fin
                  </FormLabel>
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
                            ? format(field.value, "dd MMM yyyy", { locale: es })
                            : "dd / mm / aaaa"}
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
                        fromYear={1980}
                        toYear={new Date().getFullYear() + 5}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Hora Inicio
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      className="font-mono"
                      {...field}
                      onChange={(e) => {
                        if (e.target.value.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
                          field.onChange(e.target.value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Hora Fin
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      className="font-mono"
                      {...field}
                      onChange={(e) => {
                        if (e.target.value.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
                          field.onChange(e.target.value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECCIÓN: CONTENIDO */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="border-l-2 border-amber-500 pl-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Contenido
            </span>
            <div className="flex-1 border-t border-dashed border-border" />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Descripción
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="resize-none text-sm min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="instructor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Instructor
                </FormLabel>
                <FormControl>
                  <Input className="font-medium" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <Button
          disabled={isPending}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold tracking-wide transition-colors"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            isEditing ? "Guardar cambios" : "Registrar curso"
          )}
        </Button>
      </form>
    </Form>
  );
}
