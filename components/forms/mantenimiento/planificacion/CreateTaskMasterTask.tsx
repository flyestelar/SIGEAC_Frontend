'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { FieldArrayPath, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

// shadcn/ui
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// icons
import {
  BookMarked,
  CalendarClock,
  FileText,
  Gauge,
  Layers,
  PanelBottomOpen,
  Repeat,
  Save,
  Wrench,
} from 'lucide-react';
import { Label } from '@/components/ui/label';

// ---------------- Schema ----------------
const materialSchema = z.object({ pn: z.string().min(1, 'PN requerido'), qty: z.coerce.number().min(1) });
const jsonStringOrEmpty = z
  .string()
  .transform((v) => v.trim())
  .refine(
    (v) => {
      if (!v) return true; // allow empty
      try {
        const x = JSON.parse(v);
        return typeof x === 'object' && x !== null;
      } catch {
        return false;
      }
    },
    { message: 'JSON inválido' },
  );

const schema = z
  .object({
    // Identificación
    source_type: z.enum(['MPD', 'AD', 'SB', 'EO'], { required_error: 'Fuente obligatoria' }),
    source_ref: z.string().min(1, 'Referencia obligatoria'),
    revision: z.string().min(1).default('R0'),
    effective_date: z.string().optional(),
    // Descripción
    title: z.string().min(3, 'Título muy corto'),
    description: z.string().optional(),
    task_type: z.string().optional(),
    criticality: z.enum(['MANDATORY', 'RECOMMENDED', 'OPTIONAL']).default('RECOMMENDED'),
    applicability: jsonStringOrEmpty,
    // Drivers
    is_repetitive: z.boolean().default(true),
    interval_value_hrs: z.coerce.number().optional().nullable(),
    interval_value_cyc: z.coerce.number().optional().nullable(),
    interval_value_days: z.coerce.number().optional().nullable(),
    thresh_value_hrs: z.coerce.number().optional().nullable(),
    thresh_value_cyc: z.coerce.number().optional().nullable(),
    thresh_value_days: z.coerce.number().optional().nullable(),
    repeat_value_hrs: z.coerce.number().optional().nullable(),
    repeat_value_cyc: z.coerce.number().optional().nullable(),
    repeat_value_days: z.coerce.number().optional().nullable(),
    window_pct: z.coerce.number().min(0).max(50).optional().nullable(),
    // Recursos
    std_man_hours: z.coerce.number().optional().nullable(),
    required_tools: z.array(z.string()).default([]),
    access_panels: z.array(z.string()).default([]),
  })
  .superRefine((v, ctx) => {
    const hasDriver = [
      v.interval_value_hrs,
      v.interval_value_cyc,
      v.interval_value_days,
      v.thresh_value_hrs,
      v.thresh_value_cyc,
      v.thresh_value_days,
      v.repeat_value_hrs,
      v.repeat_value_cyc,
      v.repeat_value_days,
    ].some((x) => typeof x === 'number' && !Number.isNaN(x));
    if (!hasDriver) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Define al menos un driver (HRS/CYC/DAYS)' });
    if (v.is_repetitive) {
      const anyRep = [v.repeat_value_hrs, v.repeat_value_cyc, v.repeat_value_days].some(
        (x) => typeof x === 'number' && !Number.isNaN(x),
      );
      if (!anyRep)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Marcaste repetitiva: define un parámetro de repetición.',
        });
    } else {
      const anyThr = [v.thresh_value_hrs, v.thresh_value_cyc, v.thresh_value_days].some(
        (x) => typeof x === 'number' && !Number.isNaN(x),
      );
      if (!anyThr)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'One-time: define algún parámetro de one-time.' });
    }
  });

export type TaskMasterFormInput = z.infer<typeof schema>;

// --------------- Component ---------------
export default function CreateTaskMasterTaskForm({ onSubmit }: { onSubmit?: (payload: any) => Promise<void> }) {
  const form = useForm<TaskMasterFormInput>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      source_type: 'MPD',
      source_ref: '',
      revision: 'R0',
      effective_date: '',
      title: '',
      description: '',
      task_type: '',
      criticality: 'RECOMMENDED',
      applicability: '',
      is_repetitive: true,
      required_tools: [],
      access_panels: [],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
    watch,
    setValue,
    getValues,
    reset,
  } = form;


  const tools = useFieldArray<TaskMasterFormInput, FieldArrayPath<TaskMasterFormInput>>({
    control,
    name: 'required_tools' as FieldArrayPath<TaskMasterFormInput>,
  });

  const panels = useFieldArray<TaskMasterFormInput, FieldArrayPath<TaskMasterFormInput>>({
    control,
    name: 'access_panels' as FieldArrayPath<TaskMasterFormInput>,
  });

  const isRepetitive = watch('is_repetitive');

  const payload = useMemo(() => {
    const v = getValues();
    let appl: any = null;
    try {
      appl = v.applicability ? JSON.parse(v.applicability) : null;
    } catch {
      appl = null;
    }
    return { ...v, applicability: appl, status: 'ACTIVE' };
  }, [getValues]);

  async function submit(values: TaskMasterFormInput) {
    try {
      if (onSubmit) await onSubmit(payload);
      else console.log(payload);
      toast.success('Task Master guardado');
      reset();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo guardar');
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header minimal con chips */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" className="gap-1">
          <FileText className="h-4 w-4" /> ID
        </Badge>
        <span>→</span>
        <Badge variant="outline" className="gap-1">
          <BookMarked className="h-4 w-4" /> Descripción
        </Badge>
        <span>→</span>
        <Badge variant="outline" className="gap-1">
          <CalendarClock className="h-4 w-4" /> Drivers
        </Badge>
        <span>→</span>
        <Badge variant="outline" className="gap-1">
          <Wrench className="h-4 w-4" /> Recursos
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" /> Identificación
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Form {...form}>
            <div className="contents">
              <FormField
                control={control}
                name="source_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="MPD / AD / SB / EO" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MPD">MPD</SelectItem>
                        <SelectItem value="AD">AD</SelectItem>
                        <SelectItem value="SB">SB</SelectItem>
                        <SelectItem value="EO">EO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="source_ref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia</FormLabel>
                    <FormControl>
                      <Input placeholder="05-21-00-6-801-A / AD 2025-XX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="revision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revisión</FormLabel>
                    <FormControl>
                      <Input placeholder="R0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="effective_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha efectiva</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Opcional; útil para AD/SB</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookMarked className="h-5 w-5" /> Descripción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="NLG Torque Links Inspection" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="task_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Input placeholder="GVI / LUB / FNC / MOD / ZONAL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-24" placeholder="Detalle de la tarea…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={control}
                name="criticality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Criticidad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="RECOMMENDED" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MANDATORY">MANDATORY</SelectItem>
                        <SelectItem value="RECOMMENDED">RECOMMENDED</SelectItem>
                        <SelectItem value="OPTIONAL">OPTIONAL</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="applicability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aplicabilidad (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-24 font-mono"
                        placeholder='{"aircraft":{"type":"B737","series":["800","900"]}}'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Dejar vacío si aplica a todo</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5" /> Drivers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Form {...form}>
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Repeat className="h-4 w-4" /> ¿Repetitiva?
                </div>
                {isRepetitive ? (
                  <span className="text-xs text-muted-foreground">
                    Si defines solo repetición (repeat), la tarea es recurrente sin inicial. Si defines{' '}
                    <strong>inicial</strong> + <strong>repetición</strong>, la primera vez usa <strong>inicial</strong>{' '}
                    y luego se <strong>repite</strong>.
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Si defines solo inicial (trigger), la tarea es one-time.
                  </span>
                )}
              </div>
              <FormField
                control={control}
                name="is_repetitive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>% de Ventana</Label>
              <Input
                inputMode="numeric"
                placeholder="(0-50%)"
                className=" max-w-32"
                onChange={(e) => setValue('window_pct', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* HRS */}
              <Card className="border-dashed">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gauge className="h-4 w-4" /> Horas (FH)
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Input
                    inputMode="numeric"
                    placeholder="Trigger a X horas"
                    onChange={(e) => setValue('thresh_value_hrs', e.target.value ? Number(e.target.value) : null)}
                  />
                  {isRepetitive && (
                    <Input
                      inputMode="numeric"
                      placeholder="Repetir a X horas"
                      onChange={(e) => setValue('repeat_value_hrs', e.target.value ? Number(e.target.value) : null)}
                    />
                  )}
                </CardContent>
              </Card>

              {/* CYC */}
              <Card className="border-dashed">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Ciclos (FC)
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Input
                    inputMode="numeric"
                    placeholder="Trigger a X ciclos"
                    onChange={(e) => setValue('thresh_value_cyc', e.target.value ? Number(e.target.value) : null)}
                  />
                  {isRepetitive && (
                    <Input
                      inputMode="numeric"
                      placeholder="Repetir a X ciclos"
                      onChange={(e) => setValue('repeat_value_cyc', e.target.value ? Number(e.target.value) : null)}
                    />
                  )}
                </CardContent>
              </Card>

              {/* DAYS */}
              <Card className="border-dashed">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" /> Días (CAL)
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Input
                    inputMode="numeric"
                    placeholder="Trigger a X días"
                    onChange={(e) => setValue('thresh_value_days', e.target.value ? Number(e.target.value) : null)}
                  />
                  {isRepetitive && (
                    <Input
                      inputMode="numeric"
                      placeholder="Repetir a X días"
                      onChange={(e) => setValue('repeat_value_days', e.target.value ? Number(e.target.value) : null)}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="max-w-xs">
              <FormField
                control={control}
                name="std_man_hours"
                render={() => (
                  <FormItem>
                    <FormLabel>Horas-hombre estándar</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="2.5"
                        onChange={(e) => setValue('std_man_hours', e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" /> Recursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="skills">
            <TabsList>
              <TabsTrigger value="tools" className="gap-1">
                <Wrench className="h-4 w-4" />
                Herramientas
              </TabsTrigger>
              <TabsTrigger value="panels" className="gap-1">
                <PanelBottomOpen className="h-4 w-4" />
                Panels
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="space-y-2 pt-3">
              {tools.fields.map((f, i) => (
                <div key={f.id} className="flex gap-2">
                  <Input
                    value={getValues(`required_tools.${i}`)}
                    onChange={(e) => setValue(`required_tools.${i}` as const, e.target.value)}
                    placeholder="TL-1234"
                  />
                  <Button type="button" variant="ghost" onClick={() => tools.remove(i)}>
                    Quitar
                  </Button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => tools.append('')}>
                Agregar herramienta
              </Button>
            </TabsContent>

            <TabsContent value="panels" className="space-y-2 pt-3">
              {panels.fields.map((f, i) => (
                <div key={f.id} className="flex gap-2">
                  <Input
                    value={getValues(`access_panels.${i}`)}
                    onChange={(e) => setValue(`access_panels.${i}` as const, e.target.value)}
                    placeholder="201KR"
                  />
                  <Button type="button" variant="ghost" onClick={() => panels.remove(i)}>
                    Quitar
                  </Button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => panels.append('')}>
                Agregar panel
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Separator />

      <form onSubmit={handleSubmit(submit)} className="flex justify-end">
        <Button type="submit" disabled={!isValid || isSubmitting} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar Task Master
        </Button>
      </form>

      {/* Vista previa minimal */}
      <Card className="bg-muted/30">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Vista previa</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(payload, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
