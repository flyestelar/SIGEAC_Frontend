import * as XLSX from 'xlsx';

export interface TaskCardData {
  description: string;
  old_task?: string;
  new_task?: string;
  interval_fh?: number;
  interval_fc?: number;
  interval_days?: number;
}

export function processExcelFile(file: File): Promise<TaskCardData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Look for a sheet named "Tareas" or use the first sheet
        const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'tareas') || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          throw new Error('No se encontró una hoja válida en el archivo Excel');
        }

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          throw new Error('El archivo Excel debe contener al menos una fila de encabezados y una fila de datos');
        }

        // Skip header row and process data
        const tasks: TaskCardData[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];

          // Skip empty rows
          if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) {
            continue;
          }

          const task: TaskCardData = {
            description: String(row[0] || '').trim(),
            old_task: row[1] ? String(row[1]).trim() : undefined,
            new_task: row[2] ? String(row[2]).trim() : undefined,
            interval_fh: row[3] ? Number(row[3]) : undefined,
            interval_fc: row[4] ? Number(row[4]) : undefined,
            interval_days: row[5] ? Number(row[5]) : undefined,
          };

          // Validate required fields
          if (!task.description) {
            throw new Error(`Fila ${i + 1}: La descripción es obligatoria`);
          }

          // Validate that at least one interval is provided
          if (!task.interval_fh && !task.interval_fc && !task.interval_days) {
            throw new Error(`Fila ${i + 1}: Al menos un intervalo debe ser especificado (FH, FC o Días)`);
          }

          tasks.push(task);
        }

        if (tasks.length === 0) {
          throw new Error('No se encontraron tareas válidas en el archivo Excel');
        }

        resolve(tasks);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsArrayBuffer(file);
  });
}