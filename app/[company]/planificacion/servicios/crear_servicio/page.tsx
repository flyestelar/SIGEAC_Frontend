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
import { ChevronsUpDown, Check, Loader2, Save, X, Search, ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { ContentLayout } from '@/components/layout/ContentLayout'

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
}

interface Service { id: number; code?: string | null; name: string; description?: string | null; origin_manual?: string | null; type?: string | null; manufacturer_id: number; model_id: number; series_id: number; notes?: string | null }

/**********************
 * Hooks/Actions (stubs)
 * Conecta estos hooks a tus endpoints reales.
 **********************/
function useGetManufacturers() {
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
function useSearchTaskMaster(q: string, seriesId?: number) {
  const [data, setData] = useState<TaskMasterItem[]>()
  useEffect(() => {
    if (!seriesId) { setData([]); return }
    setTimeout(() => setData([
      { id: 1001, description: 'Inspección de spoilers', default_ata: '27-30-00', origin_manual: 'AMM' },
      { id: 1002, description: 'Chequeo latch compuerta', default_ata: '25-10-00', origin_manual: 'AMM' },
      { id: 1003, description: 'Revisión hidráulica', default_ata: '29-00-00', origin_manual: 'AMM' },
    ].filter(t => t.description.toLowerCase().includes(q.toLowerCase()))), 150)
  }, [q, seriesId])
  return { data, isLoading: !data && q !== undefined }
}

function useCreateService() {
  const [isPending, setPending] = useState(false)
  return {
    isPending,
    async mutateAsync(payload: Omit<Service, 'id'>): Promise<Service> {
      setPending(true)
      await new Promise(r => setTimeout(r, 400))
      setPending(false)
      return { id: Math.floor(Math.random() * 10000), ...payload }
    }
  }
}

// Adjuntar tareas al servicio (puedes fusionarlo con createService si tu API lo permite)
function useAttachTasksToService() {
  const [isPending, setPending] = useState(false)
  return {
    isPending,
    async mutateAsync(payload: { service_id: number; tasks: { task_id: number; ata?: string | null; extra_notes?: string | null; position?: number | null }[] }): Promise<{ count: number }> {
      setPending(true)
      await new Promise(r => setTimeout(r, 400))
      setPending(false)
      return { count: payload.tasks.length }
    }
  }
}

/**********************
 * Schema del formulario (SIN plantillas)
 **********************/
const serviceSchema = z.object({
  manufacturer_id: z.string().min(1, 'Seleccione un fabricante'),
  model_id: z.string().min(1, 'Seleccione un modelo'),
  series_id: z.string().min(1, 'Seleccione una serie'),

  service_code: z.string().optional(),
  service_name: z.string().min(1, 'El nombre del servicio es obligatorio'),
  service_description: z.string().optional(),
  service_origin_manual: z.string().optional(),
  service_type: z.string().optional(),

  notes: z.string().optional(),
  tasks: z.array(z.object({
    task_id: z.number(),
    ata: z.string().optional(),
    position: z.number().min(0).optional(),
    extra_notes: z.string().optional(),
  })).min(1, 'Debes seleccionar al menos una tarea')
})
export type ServiceFormValues = z.infer<typeof serviceSchema>

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
export default function ServiceBuilder() {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
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

  const seriesIdNum = form.watch('series_id') ? parseInt(form.watch('series_id')!) : undefined
  const { data: tasks, isLoading: tasksLoading } = useSearchTaskMaster(taskQuery, seriesIdNum)

  const createService = useCreateService()
  const attachTasks = useAttachTasksToService()

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

  const totalPending = createService.isPending || attachTasks.isPending

  async function onSubmit(values: ServiceFormValues) {
    try {
      const service = await createService.mutateAsync({
        code: values.service_code || null,
        name: values.service_name,
        description: values.service_description || null,
        origin_manual: values.service_origin_manual || null,
        type: values.service_type || null,
        manufacturer_id: parseInt(values.manufacturer_id),
        model_id: parseInt(values.model_id),
        series_id: parseInt(values.series_id),
        notes: values.notes || null,
      })

      await attachTasks.mutateAsync({
        service_id: service.id,
        tasks: values.tasks.map(t => ({
          task_id: t.task_id,
          ata: t.ata || null,
          position: t.position ?? null,
          extra_notes: t.extra_notes || null,
        }))
      })

      toast.success('Servicio creado correctamente')
      form.reset({ tasks: [] })
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
    <ContentLayout title='Creación de Servicios'>
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-sm max-w-7xl">
          <CardHeader>
            <CardTitle className="text-2xl">Crear Servicio (desde cero)</CardTitle>
            <CardDescription>Define la combinación Fabricante → Modelo → Serie, completa los datos del servicio y agrega tareas desde el task_master.</CardDescription>
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

                {/* Datos del servicio (sin plantillas) */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <FormField name="service_code" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Código</FormLabel>
                      <FormControl><Input placeholder="Ej. A, B, C (opcional)" {...field} /></FormControl>
                      <FormDescription>Código interno o categoría del servicio (opcional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="service_name" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-4">
                      <FormLabel>Nombre del servicio</FormLabel>
                      <FormControl><Input placeholder="Ej. Servicio A – B737-200" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="service_origin_manual" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Manual</FormLabel>
                      <FormControl><Input placeholder="AMM / SRM / etc." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="service_type" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Tipo</FormLabel>
                      <FormControl><Input placeholder="Preventivo / Correctivo" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="service_description" control={form.control} render={({ field }) => (
                    <FormItem className="md:col-span-6">
                      <FormLabel>Descripción</FormLabel>
                      <FormControl><Textarea rows={2} placeholder="Descripción breve del servicio" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Tareas */}
                <FormField name="tasks" control={form.control} render={() => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Tareas</FormLabel>
                    <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-between"
                          onClick={() => setTaskDialogOpen(true)}
                          disabled={!seriesIdNum}
                        >
                          <span>
                            {selectedTasks.length > 0 ? `${selectedTasks.length} tarea(s) seleccionada(s)` : 'Seleccionar tareas'}
                          </span>
                          <ListChecks className="ml-2 h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl">
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

                {/* Notas del servicio */}
                <FormField name="notes" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Observaciones específicas de este servicio" {...field} />
                    </FormControl>
                  </FormItem>
                )} />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => form.reset({ tasks: [] })}>Cancelar</Button>
                  <Button type="submit" disabled={totalPending}>
                    {totalPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>) : (<><Save className="mr-2 h-4 w-4" /> Guardar servicio</>)}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Consejo: si muchas series comparten tareas, podrás clonar este servicio y ajustar diferencias mínimas.
          </CardFooter>
        </Card>
      </div>
    </ContentLayout>
  )
}
