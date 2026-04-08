import * as XLSX from 'xlsx';

export interface TaskCardData {
  description: string;
  old_task: string;
  new_task: string;
  applicable: boolean;
}

export interface ParsedMaintenanceInterval {
  fh?: number;
  fc?: number;
  days?: number;
}

const STANDARD_SERVICE_INTERVALS: Record<string, ParsedMaintenanceInterval> = {
  '1a': { fh: 250 },
  '2a': { fh: 500 },
  '4a': { fh: 1000 },
  '8a': { fh: 2000 },
  '1c': { fh: 4000 },
  '2c': { fh: 8000 },
  '4c': { fh: 16000 },
  '6c': { fh: 24000 },
  '1d': { fh: 24000 },
  '2d': { fh: 24000 },
  '8c': { fh: 32000 },
  si: { fc: 24000 },
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseLocalizedNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/\s+/g, '');

  if (!cleaned) return undefined;

  if (cleaned.includes('.') && cleaned.includes(',')) {
    const normalized =
      cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
    const value = Number(normalized);
    return Number.isFinite(value) ? value : undefined;
  }

  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    const normalized = parts[1]?.length === 3 ? parts.join('') : cleaned.replace(',', '.');
    const value = Number(normalized);
    return Number.isFinite(value) ? value : undefined;
  }

  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    const normalized = parts[parts.length - 1]?.length === 3 ? parts.join('') : cleaned;
    const value = Number(normalized);
    return Number.isFinite(value) ? value : undefined;
  }

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : undefined;
}

export function parseMaintenanceInterval(interval: unknown): ParsedMaintenanceInterval {
  if (interval === undefined || interval === null || interval === '') {
    return {};
  }

  if (typeof interval === 'number') {
    return Number.isFinite(interval) ? { fh: interval } : {};
  }

  const normalized = normalizeText(String(interval));
  if (!normalized) return {};

  const parsed: ParsedMaintenanceInterval = {};
  const regex = /([0-9][0-9.,]*)\s*(fh|fc|dias|dia|days|day)\b/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    const value = parseLocalizedNumber(match[1]);
    if (value === undefined) continue;

    const unit = match[2];

    if (unit === 'fh') {
      parsed.fh = value;
    } else if (unit === 'fc') {
      parsed.fc = value;
    } else {
      parsed.days = value;
    }
  }

  const standardTokens = normalized
    .split(',')
    .map((token) => token.trim().replace(/\s+/g, ''))
    .filter(Boolean);

  for (const token of standardTokens) {
    const standard = STANDARD_SERVICE_INTERVALS[token];
    if (!standard) continue;

    if (standard.fh !== undefined) parsed.fh = standard.fh;
    if (standard.fc !== undefined) parsed.fc = standard.fc;
    if (standard.days !== undefined) parsed.days = standard.days;
  }

  if (parsed.fh !== undefined || parsed.fc !== undefined || parsed.days !== undefined) {
    return parsed;
  }

  const numberMatch = normalized.match(/[0-9][0-9.,]*/);
  const parsedNumber = numberMatch ? parseLocalizedNumber(numberMatch[0]) : undefined;

  // Backward-compatible fallback: numeric values without suffix are treated as FH.
  return parsedNumber !== undefined ? { fh: parsedNumber } : {};
}

export async function processExcelFile(file: File): Promise<TaskCardData[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);

  // Look for a sheet named "Tareas" or use the first sheet
  const sheetName = workbook.SheetNames[0];
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

  // Fixed columns:
  const OLD_TASK_COL = 0;
  const DESCRIPTION_COL = 1;
  const NEW_TASK_COL = 2;

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];

    // Skip empty rows
    if (!row || row.every((cell) => cell === undefined || cell === null || cell === '')) {
      continue;
    }

    const descriptionCell = row[DESCRIPTION_COL];
    const oldTaskCell = row[OLD_TASK_COL];
    const newTaskCell = row[NEW_TASK_COL];

    const task: TaskCardData = {
      description: String(descriptionCell || '').trim(),
      old_task: String(oldTaskCell || '').trim(),
      new_task: String(newTaskCell || '').trim(),
      applicable: true,
    };

    tasks.push(task);
  }

  if (tasks.length === 0) {
    throw new Error('No se encontraron tareas válidas en el archivo Excel');
  }

  return tasks;
}
