import { processExcelFile, TaskCardData } from '@/actions/planificacion/control_mantenimiento/excelProcessor';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CircleHelpIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface TaskImportFieldProps {
  onSuccess: (fileName: string, importedTasks: TaskCardData[]) => void;
  onError: (errorMessage: string) => void;
}

function TaskImportField(props: TaskImportFieldProps) {
  const { onSuccess, onError } = props;
  const handleExcelSelection = async (file: File) => {
    try {
      const parsedTasks = await processExcelFile(file);
      onSuccess(file.name, parsedTasks);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo procesar el archivo Excel');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted: (acceptedFiles) => {
      handleExcelSelection(acceptedFiles[0]);
    },
    onDropRejected() {
      onError(
        'Archivo rechazado. Asegúrese de que sea un archivo Excel válido (.xlsx, .xls, .ods) y que no exceda el límite de tamaño permitido.',
      );
    },
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-md border border-dashed p-4 transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/30'
        }`}
    >
      <input {...getInputProps()} />
      <p className="text-sm font-medium">Importar tareas desde archivo</p>
      <p className="text-xs text-muted-foreground mt-1">
        Arrastre y suelte su archivo aquí, o haga clic para seleccionar un archi (.xlsx, .xls, .ods).
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="pointer-events-none">
          Seleccionar archivo
        </Button>
        <ExcelFormatHelpPopover />
      </div>
    </div>
  );
}

export default TaskImportField;

function ExcelFormatHelpPopover() {
  return (
    <Popover>
      <PopoverTrigger
        asChild
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Button type="button" variant="secondary" size="icon" className="gap-2">
          <CircleHelpIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[420px] space-y-3">
        <div>
          <p className="text-sm font-semibold">Formato esperado</p>
          <p className="text-xs text-muted-foreground">
            El archivo debe incluir solo tareas con estas columnas: Old Task Card, Descripción y New Task Card.
          </p>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-1 text-left">Old Task</th>
                <th className="px-2 py-1 text-left">Descripción</th>
                <th className="px-2 py-1 text-left">New Task</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-2 py-1">H1-001</td>
                <td className="px-2 py-1">Inspeccionar sistema hidráulico</td>
                <td className="px-2 py-1">H1-002</td>
              </tr>
              <tr className="border-t">
                <td className="px-2 py-1">F2-001</td>
                <td className="px-2 py-1">Verificar funcionamiento de flaps</td>
                <td className="px-2 py-1">F2-002</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          El intervalo se define en el formulario del control y se aplica automáticamente a todas las tareas importadas.
        </p>
      </PopoverContent>
    </Popover>
  );
}
