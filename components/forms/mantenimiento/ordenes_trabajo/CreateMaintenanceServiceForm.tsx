'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
} from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { ChevronsUpDown, Check, Plus, Loader2, Save, X, Search, ListChecks } from 'lucide-react'
import { toast } from 'sonner'

/**********************
 * Tipos de dominio
 **********************/
interface Manufacturer { id: number; name: string }
interface Model { id: number; name: string; manufacturer_id: number }
interface Series { id: number; name: string; model_id: number }

interface TaskMasterItem {
  id: number
  description: string
  default_ata?: string | null
  origin_manual?: string | null
  // material requirements, etc., si aplica
}

interface ServiceTemplate { id: number; code: string; name: string; description?: string | null; origin_manual?: string | null; type?: string | null }
interface ServiceVariant { id: number; service_template_id: number; manufacturer_id: number; model_id: number; series_id: number }

/**********************
 * Hooks/Actions (stubs)
 * Conecta estos hooks a tus endpoints reales.
 **********************/
function useGetManufacturers() {
  // reemplaza por SWR/React Query
  const [data, setData] = useState<Manufacturer[]>()
  useEffect(() => {
    setTimeout(() => setData([
      { id: 1, name: 'Boeing' },
      { id: 2, name: 'Airbus' },
    ]), 200)
  }, [])
  return { data, isLoading: !data }
}
function useGetModels(manufacturerId?: number) {
  const [data, setData] = useState<Model[]>()
  useEffect(() => {
    if (!manufacturerId) return
    setTimeout(() => setData([
      { id: 11, name: 'B737', manufacturer_id: 1 },
      { id: 12, name: 'B747', manufacturer_id: 1 },
      { id: 21, name: 'A320', manufacturer_id: 2 },
    ].filter(m => m.manufacturer_id === manufacturerId)), 200)
  }, [manufacturerId])
  return { data, isLoading: manufacturerId !== undefined && !data }
}
function useGetSeries(modelId?: number) {
  const [data, setData] = useState<Series[]>()
  useEffect(() => {
    if (!modelId) return
    setTimeout(() => setData([
      { id: 101, name: '100', model_id: 11 },
      { id: 102, name: '200', model_id: 11 },
      { id: 201, name: '800', model_id: 21 },
    ].filter(s => s.model_id === modelId)), 200)
  }, [modelId])
  return { data, isLoading: modelId !== undefined && !data }
}
function useSearchTaskMaster(q: string) {
  const [data, setData] = useState<TaskMasterItem[]>()
  useEffect(() => {
    setTimeout(() => setData([
      { id: 1001, description: 'Inspección de spoilers', default_ata: '27-30-00', origin_manual: 'AMM' },
      { id: 1002, description: 'Chequeo latch compuerta', default_ata: '25-10-00', origin_manual: 'AMM' },
      { id: 1003, description: 'Revisión hidráulica', default_ata: '29-00-00', origin_manual: 'AMM' },
    ].filter(t => t.description.toLowerCase().includes(q.toLowerCase()))), 150)
  }, [q])
  return { data, isLoading: !data && q !== undefined }
}
function useListServiceTemplates() {
  const [data, setData] = useState<ServiceTemplate[]>()
  useEffect(() => {
    setTimeout(() => setData([
      { id: 1, code: 'A', name: 'Servicio A', origin_manual: 'AMM', type: 'Preventivo' },
      { id: 2, code: 'B', name: 'Servicio B', origin_manual: 'AMM', type: 'Preventivo' },
    ]), 200)
  }, [])
  return { data, isLoading: !data }
}
function useCreateServiceTemplate() {
  const [isPending, setPending] = useState(false)
  return {
    isPending,
    async mutateAsync(payload: Omit<ServiceTemplate, 'id'>): Promise<ServiceTemplate> {
      setPending(true)
      await new Promise(r => setTimeout(r, 400))
      setPending(false)
      return { id: Math.floor(Math.random() * 10000), ...payload }
    }
  }
}
function useCreateServiceVariant() {
  const [isPending, setPending] = useState(false)
  return {
    isPending,
    async mutateAsync(payload: { service_template_id: number; manufacturer_id: number; model_id: number; series_id: number; notes?: string | null }): Promise<ServiceVariant> {
      setPending(true)
      await new Promise(r => setTimeout(r, 400))
      setPending(false)
      return { id: Math.floor(Math.random() * 10000), ...payload }
    }
  }
}
function useAttachTasksToVariant() {
  const [isPending, setPending] = useState(false)
  return {
    isPending,
    async mutateAsync(payload: { variant_id: number; tasks: { task_id: number; ata?: string | null; extra_notes?: string | null; position?: number | null }[] }): Promise<{ count: number }> {
      setPending(true)
      await new Promise(r => setTimeout(r, 400))
      setPending(false)
      return { count: payload.tasks.length }
    }
  }
}

/**********************
 * Schema del formulario
 **********************/
const serviceVariantSchema = z.object({
  manufacturer_id: z.string().min(1, 'Seleccione un fabricante'),
  model_id: z.string().min(1, 'Seleccione un modelo'),
  series_id: z.string().min(1, 'Seleccione una serie'),
  template_mode: z.enum(['select', 'create']).default('select'),
  service_template_id: z.string().optional(),
  template_code: z.string().optional(),
  template_name: z.string().optional(),
  template_description: z.string().optional(),
  template_origin_manual: z.string().optional(),
  template_type: z.string().optional(),
  notes: z.string().optional(),
  tasks: z.array(z.object({
    task_id: z.number(),
    ata: z.string().optional(),
    position: z.number().min(0).optional(),
    extra_notes: z.string().optional(),
  })).min(1, 'Debes seleccionar al menos una tarea')
}).refine((val) => {
  if (val.template_mode === 'select') return !!val.service_template_id
  return !!val.template_code && !!val.template_name
}, { message: 'Debe seleccionar o crear una plantilla de servicio', path: ['service_template_id'] })

export type ServiceVariantFormValues = z.infer<typeof serviceVariantSchema>

/**********************
 * UI Helpers
 **********************/
function ComboBox<T extends { id: number; name: string }>(props: {
  items?: T[]
  value?: string
  onSelect: (id: number) => void
  placeholder: string
  disabled?: boolean
}) {
  const { items, value, onSelect, placeholder, disabled } = props
  const selected = items?.find(i => `${i.id}` === value)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" disabled={disabled} className={cn('w-full justify-between', !value && 'text-muted-foreground')}>
          {selected ? selected.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[320px]">
        <Command>
          <CommandInput placeholder={`Buscar...`} />
          <CommandList>
            <CommandEmpty className="p-2 text-xs">Sin resultados</CommandEmpty>
            <CommandGroup>
              {items?.map(it => (
                <CommandItem key={it.id} value={`${it.id}`} onSelect={() => onSelect(it.id)}>
                  <Check className={cn('mr-2 h-4 w-4', `${it.id}` === value ? 'opacity-100' : 'opacity-0')} />
                  {it.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**********************
 * Componente principal
 **********************/
export default function CreateMaintenanceServiceForm() {
  const form = useForm<ServiceVariantFormValues>({
    resolver: zodResolver(serviceVariantSchema),
    defaultValues: {
      template_mode: 'select',
      tasks: [],
    },
  })

  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskQuery, setTaskQuery] = useState('')

  const { data: manufacturers, isLoading: mfrLoading } = useGetManufacturers()
  const manufacturerId = form.watch('manufacturer_id')
  const { data: models, isLoading: modelsLoading } = useGetModels(manufacturerId ? parseInt(manufacturerId) : undefined)
  const modelId = form.watch('model_id')
  const { data: series, isLoading: seriesLoading } = useGetSeries(modelId ? parseInt(modelId) : undefined)

  const { data: templates, isLoading: tplLoading } = useListServiceTemplates()
  const { data: tasks, isLoading: tasksLoading } = useSearchTaskMaster(taskQuery)

  const createTemplate = useCreateServiceTemplate()
  const createVariant = useCreateServiceVariant()
  const attachTasks = useAttachTasksToVariant()

  const selectedTasks = form.watch('tasks')

  const groupedTasks = useMemo(() => {
    const groups: Record<string, TaskMasterItem[]> = {}
      ; (tasks || []).forEach(t => {
        const key = t.origin_manual || 'General'
        groups[key] = groups[key] || []
        groups[key].push(t)
      })
    return groups
  }, [tasks])

  const totalPending = createTemplate.isPending || createVariant.isPending || attachTasks.isPending

  async function onSubmit(values: ServiceVariantFormValues) {
    try {
      let templateId: number
      if (values.template_mode === 'create') {
        const created = await createTemplate.mutateAsync({
          code: values.template_code!,
          name: values.template_name!,
          description: values.template_description || '',
          origin_manual: values.template_origin_manual || undefined,
          type: values.template_type || undefined,
        })
        templateId = created.id
      } else {
        templateId = parseInt(values.service_template_id!)
      }

      const variant = await createVariant.mutateAsync({
        service_template_id: templateId,
        manufacturer_id: parseInt(values.manufacturer_id),
        model_id: parseInt(values.model_id),
        series_id: parseInt(values.series_id),
        notes: values.notes || null,
      })

      await attachTasks.mutateAsync({
        variant_id: variant.id,
        tasks: values.tasks.map(t => ({
          task_id: t.task_id,
          ata: t.ata || null,
          position: t.position ?? null,
          extra_notes: t.extra_notes || null,
        }))
      })

      toast.success('Servicio creado correctamente')
      form.reset({ template_mode: 'select', tasks: [] })
    } catch (e: any) {
      toast.error('No se pudo crear el servicio')
    }
  }

  function toggleTask(t: TaskMasterItem) {
    const exists = selectedTasks.some(x => x.task_id === t.id)
    if (exists) {
      form.setValue('tasks', selectedTasks.filter(x => x.task_id !== t.id), { shouldValidate: true })
    } else {
      form.setValue('tasks', [...selectedTasks, { task_id: t.id, ata: t.default_ata || undefined, position: selectedTasks.length }], { shouldValidate: true })
    }
  }

  function setTaskField(taskId: number, field: 'ata' | 'position' | 'extra_notes', value: string | number) {
    form.setValue('tasks', selectedTasks.map(t => t.task_id === taskId ? { ...t, [field]: value } : t), { shouldValidate: true })
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Servicio</CardTitle>
          <CardDescription>Define la combinación Fabricante → Modelo → Serie, selecciona o crea la plantilla (A/B/C) y agrega las tareas desde el task_master.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              {/* Combos jerárquicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField name="manufacturer_id" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabricante</FormLabel>
                    <FormControl>
                      <ComboBox
                        items={manufacturers}
                        value={field.value}
                        disabled={mfrLoading}
                        onSelect={(id) => {
                          field.onChange(`${id}`)
                          form.setValue('model_id', '')
                          form.setValue('series_id', '')
                        }}
                        placeholder="Selecciona un fabricante"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="model_id" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <ComboBox
                        items={models}
                        value={field.value}
                        disabled={!manufacturerId || modelsLoading}
                        onSelect={(id) => { field.onChange(`${id}`); form.setValue('series_id', '') }}
                        placeholder="Selecciona un modelo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="series_id" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serie</FormLabel>
                    <FormControl>
                      <ComboBox
                        items={series}
                        value={field.value}
                        disabled={!modelId || seriesLoading}
                        onSelect={(id) => field.onChange(`${id}`)}
                        placeholder="Selecciona una serie"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Plantilla de servicio (A/B/C) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <FormField name="template_mode" control={form.control} render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Modo de plantilla</FormLabel>
                    <div className="flex gap-2">
                      <Button type="button" variant={field.value === 'select' ? 'default' : 'outline'} onClick={() => field.onChange('select')}>Seleccionar</Button>
                      <Button type="button" variant={field.value === 'create' ? 'default' : 'outline'} onClick={() => field.onChange('create')}>
                        <Plus className="mr-1 h-4 w-4" /> Crear
                      </Button>
                    </div>
                    <FormDescription>Usa una plantilla existente o crea una nueva (A/B/C).</FormDescription>
                  </FormItem>
                )} />

                {/* Seleccionar */}
                {form.watch('template_mode') === 'select' && (
                  <FormField name="service_template_id" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Plantilla de servicio</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className={cn('w-full justify-between', !field.value && 'text-muted-foreground')} disabled={tplLoading}>
                              {field.value ? (templates?.find(t => `${t.id}` === field.value)?.name) : 'Selecciona una plantilla'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-[480px]">
                            <Command>
                              <CommandInput placeholder="Buscar plantilla..." />
                              <CommandList>
                                <CommandEmpty className="p-2 text-xs">Sin resultados</CommandEmpty>
                                <CommandGroup>
                                  {templates?.map(t => (
                                    <CommandItem key={t.id} value={`${t.id}`} onSelect={() => field.onChange(`${t.id}`)}>
                                      <Check className={cn('mr-2 h-4 w-4', `${t.id}` === field.value ? 'opacity-100' : 'opacity-0')} />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{t.name} <span className="text-muted-foreground">({t.code})</span></span>
                                        <span className="text-xs text-muted-foreground">{t.type} · {t.origin_manual}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {/* Crear */}
                {form.watch('template_mode') === 'create' && (
                  <div className="md:col-span-2 grid grid-cols-6 gap-3">
                    <FormField name="template_code" control={form.control} render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Código</FormLabel>
                        <FormControl><Input placeholder="A" {...field} /></FormControl>
                        <FormDescription>Ej. A, B, C</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="template_name" control={form.control} render={({ field }) => (
                      <FormItem className="col-span-4">
                        <FormLabel>Nombre</FormLabel>
                        <FormControl><Input placeholder="Servicio A" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="template_origin_manual" control={form.control} render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Manual</FormLabel>
                        <FormControl><Input placeholder="AMM" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="template_type" control={form.control} render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Tipo</FormLabel>
                        <FormControl><Input placeholder="Preventivo" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="template_description" control={form.control} render={({ field }) => (
                      <FormItem className="col-span-6">
                        <FormLabel>Descripción</FormLabel>
                        <FormControl><Textarea rows={2} placeholder="Descripción de la plantilla" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}
              </div>

              {/* Tareas */}
              <FormField name="tasks" control={form.control} render={() => (
                <FormItem>
                  <FormLabel>Tareas</FormLabel>
                  <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="justify-between">
                        <span>
                          {selectedTasks.length > 0 ? `${selectedTasks.length} tarea(s) seleccionada(s)` : 'Seleccionar tareas'}
                        </span>
                        <ListChecks className="ml-2 h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Seleccionar tareas</DialogTitle>
                        <DialogDescription>Busca en el task_master y agrega las tareas al servicio.</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-12 gap-4 h-[calc(80vh-8rem)]">
                        {/* Panel búsqueda */}
                        <div className="col-span-4 border rounded-lg p-3 flex flex-col">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-8" placeholder="Buscar tareas..." value={taskQuery} onChange={(e) => setTaskQuery(e.target.value)} />
                          </div>
                          <div className="flex items-center justify-between mt-3 text-sm">
                            <span className="text-muted-foreground">Resultados</span>
                            <Badge variant="outline">{tasks?.length || 0}</Badge>
                          </div>
                          <ScrollArea className="mt-2 rounded-md border h-full">
                            <div className="p-2 space-y-1">
                              {tasksLoading ? (
                                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...</div>
                              ) : (
                                Object.entries(groupedTasks).map(([group, list]) => (
                                  <div key={group} className="space-y-1">
                                    <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">{group}</div>
                                    {list.map(t => {
                                      const checked = selectedTasks.some(x => x.task_id === t.id)
                                      return (
                                        <div key={t.id} className={cn('flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50', checked && 'bg-muted/50')}>
                                          <Checkbox checked={checked} onCheckedChange={() => toggleTask(t)} />
                                          <div className="flex flex-col">
                                            <span className="text-sm">{t.description}</span>
                                            <span className="text-xs text-muted-foreground">ATA por defecto: {t.default_ata || '—'}</span>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* Panel seleccionadas */}
                        <div className="col-span-8 border rounded-lg p-3 flex flex-col">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Seleccionadas</span>
                            <Badge variant="secondary">{selectedTasks.length}</Badge>
                          </div>
                          <ScrollArea className="mt-2 rounded-md border h-full">
                            <div className="divide-y">
                              {selectedTasks.length === 0 ? (
                                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">No hay tareas seleccionadas</div>
                              ) : (
                                selectedTasks
                                  .slice()
                                  .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                                  .map(sel => (
                                    <div key={sel.task_id} className="p-3 grid grid-cols-12 gap-3 items-center">
                                      <div className="col-span-5">
                                        <div className="text-sm font-medium">{tasks?.find(t => t.id === sel.task_id)?.description || `Tarea ${sel.task_id}`}</div>
                                        <div className="text-xs text-muted-foreground">ID: {sel.task_id}</div>
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">ATA</Label>
                                        <Input value={sel.ata || ''} placeholder="25-10-00" onChange={(e) => setTaskField(sel.task_id, 'ata', e.target.value)} />
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">Posición</Label>
                                        <Input type="number" value={sel.position ?? 0} onChange={(e) => setTaskField(sel.task_id, 'position', Number(e.target.value))} />
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">Notas</Label>
                                        <Input value={sel.extra_notes || ''} placeholder="Opcional" onChange={(e) => setTaskField(sel.task_id, 'extra_notes', e.target.value)} />
                                      </div>
                                      <div className="col-span-1 flex justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => form.setValue('tasks', selectedTasks.filter(x => x.task_id !== sel.task_id), { shouldValidate: true })}>
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cerrar</Button>
                        <Button onClick={() => setTaskDialogOpen(false)}>Confirmar selección</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <FormDescription className="text-xs">Selecciona tareas del task_master y ajusta ATA/posición/nota si es necesario.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Notas de la variante */}
              <FormField name="notes" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Observaciones específicas de esta variante" {...field} />
                  </FormControl>
                </FormItem>
              )} />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => form.reset({ template_mode: 'select', tasks: [] })}>Cancelar</Button>
                <Button type="submit" disabled={totalPending}>
                  {totalPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>) : (<><Save className="mr-2 h-4 w-4" /> Guardar servicio</>)}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Consejo: si muchas series comparten tareas, crea una variante base y luego clónala desde backend para acelerar la configuración.
        </CardFooter>
      </Card>
    </div>
  )
}
