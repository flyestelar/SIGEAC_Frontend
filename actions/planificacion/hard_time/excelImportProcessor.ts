import * as XLSX from 'xlsx';

export type HardTimeImportControl = 'HORAS' | 'CICLOS' | 'DIAS' | 'UNKNOWN';
export type HardTimePositionConfidence = 'high' | 'medium' | 'low' | 'manual';

export interface HardTimePositionSuggestion {
  position: string | null;
  confidence: HardTimePositionConfidence;
  rule: string | null;
  tokens: string[];
}

export interface HardTimeImportIntervalPreview {
  task_description: string;
  control: HardTimeImportControl;
  interval_hours: number | null;
  interval_cycles: number | null;
  interval_days: number | null;
  limit_value: number | null;
  last_value: string | null;
  next_value: string | null;
  expiry_date: string | null;
  remanent_value: number | null;
  status_label: string | null;
  performed_by: string | null;
  airframe_hours: number | null;
  airframe_cycles: number | null;
  airframe_date: string | null;
  source_sheet: string;
}

export interface HardTimeImportComponentPreview {
  description: string;
  part_number: string | null;
  serial_number: string | null;
  reference: string | null;
  position_suggestion: HardTimePositionSuggestion;
  warnings: string[];
  intervals: HardTimeImportIntervalPreview[];
}

export interface HardTimeImportPreview {
  sheets: string[];
  components: HardTimeImportComponentPreview[];
  summary: {
    component_count: number;
    interval_count: number;
    position_confidence: Record<HardTimePositionConfidence, number>;
    by_control: Record<HardTimeImportControl, number>;
    manual_review_count: number;
  };
}

interface ParsedRow {
  description: string;
  part_number: string | null;
  serial_number: string | null;
  reference: string | null;
  task_description: string;
  control: HardTimeImportControl;
  limit_value: number | null;
  interval_hours: number | null;
  interval_cycles: number | null;
  interval_days: number | null;
  last_value: string | null;
  next_value: string | null;
  expiry_date: string | null;
  remanent_value: number | null;
  status_label: string | null;
  performed_by: string | null;
  airframe_hours: number | null;
  airframe_cycles: number | null;
  airframe_date: string | null;
  source_sheet: string;
}

function normalizeWhitespace(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeAscii(value: unknown): string {
  return normalizeWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function cleanDescription(value: unknown): string {
  return normalizeWhitespace(value).replace(/\s+-\s+/g, ' - ');
}

function parseLocalizedNumber(raw: unknown): number | null {
  const cleaned = normalizeWhitespace(raw).replace(/\s+/g, '');

  if (!cleaned) return null;

  if (cleaned.includes('.') && cleaned.includes(',')) {
    const normalized =
      cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    const normalized = parts[1]?.length === 3 ? parts.join('') : cleaned.replace(',', '.');
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    const normalized = parts[parts.length - 1]?.length === 3 ? parts.join('') : cleaned;
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function isHeaderRow(description: string, partNumber: string, taskDescription: string): boolean {
  const desc = normalizeAscii(description);
  const part = normalizeAscii(partNumber);
  const task = normalizeAscii(taskDescription);

  return (
    desc === 'DESCRIPCION' ||
    desc === 'DESCRIPCION / DESCRIPTION' ||
    part === 'NUMERO DE PARTE' ||
    task === 'DESCRIPCION DE TRABAJO'
  );
}

function shouldIgnoreDescription(description: string): boolean {
  const value = normalizeAscii(description);

  return (
    !value ||
    value.startsWith('CERTIFICO QUE SE HAN VERIFICADO LOS REGISTROS') ||
    value.startsWith('NOMBRE Y SELLLO DE LA ORGANIZACION') ||
    value.startsWith('ESTELAR LATINOAMERICA') ||
    value.startsWith('FORMA INAC-43-004')
  );
}

function inferControl(limitType: string, controlCell: string): HardTimeImportControl {
  const control = normalizeAscii(controlCell);
  const limit = normalizeAscii(limitType);

  if (control === 'HORAS' || control === 'HORA') return 'HORAS';
  if (control === 'CICLOS' || control === 'CICLO') return 'CICLOS';
  if (control === 'DIAS' || control === 'DIA') return 'DIAS';

  if (limit === 'H' || limit === 'FH') return 'HORAS';
  if (limit === 'C' || limit === 'FC') return 'CICLOS';
  if (limit === 'D') return 'DIAS';

  return 'UNKNOWN';
}

function extractRegex(description: string, regex: RegExp, token: string, tokens: string[]) {
  if (regex.test(description) && !tokens.includes(token)) {
    tokens.push(token);
  }
}

export function inferHardTimePosition(description: string): HardTimePositionSuggestion {
  const normalized = normalizeAscii(description);
  const tokens: string[] = [];

  extractRegex(normalized, /\bAPU\b/, 'APU', tokens);
  extractRegex(normalized, /\bGEN(?:ERATOR)?\s*1\b|\bGEN\s*1\b/, 'GEN-1', tokens);
  extractRegex(normalized, /\bGEN(?:ERATOR)?\s*2\b|\bGEN\s*2\b/, 'GEN-2', tokens);
  extractRegex(normalized, /\bENG(?:INE)?\s*1\b/, 'ENG-1', tokens);
  extractRegex(normalized, /\bENG(?:INE)?\s*2\b/, 'ENG-2', tokens);
  extractRegex(normalized, /\bL1\b/, 'L1', tokens);
  extractRegex(normalized, /\bR1\b/, 'R1', tokens);
  extractRegex(normalized, /\bL2\b/, 'L2', tokens);
  extractRegex(normalized, /\bR2\b/, 'R2', tokens);
  extractRegex(normalized, /\bCAPT(?:AIN)?\b/, 'CAPT', tokens);
  extractRegex(normalized, /\bF\/O\b|\bFO\b|\bFIRST OFFICER\b/, 'FO', tokens);
  extractRegex(normalized, /\bFWD\b/, 'FWD', tokens);
  extractRegex(normalized, /\bAFT\b/, 'AFT', tokens);
  extractRegex(normalized, /\bLH\b|\bLEFT\b/, 'LH', tokens);
  extractRegex(normalized, /\bRH\b|\bRIGHT\b/, 'RH', tokens);
  extractRegex(normalized, /\bCTR\b|\bCENTER\b/, 'CTR', tokens);

  const binMatch = normalized.match(/\bBIN\s*#?\s*(\d{1,3})\b/);
  if (binMatch) {
    tokens.push(`BIN-${binMatch[1]}`);
  }

  const sideIndexMatch = normalized.match(/\b(LH|RH)\s*([1-9])\b/);
  if (sideIndexMatch) {
    tokens.push(`${sideIndexMatch[1]}-${sideIndexMatch[2]}`);
  }

  const cylinderMatch = normalized.match(/\bCYL(?:INDER)?\s*#?\s*([1-9])\b/);
  if (cylinderMatch) {
    tokens.push(`CYL-${cylinderMatch[1]}`);
  }

  if (!tokens.includes('GEN-1') && /\b#\s*1\b/.test(normalized) && /\bGENERATOR\b/.test(normalized)) {
    tokens.push('GEN-1');
  }

  if (!tokens.includes('GEN-2') && /\b#\s*2\b/.test(normalized) && /\bGENERATOR\b/.test(normalized)) {
    tokens.push('GEN-2');
  }

  const hasStrongToken = tokens.some((token) =>
    ['APU', 'GEN-1', 'GEN-2', 'ENG-1', 'ENG-2', 'L1', 'R1', 'L2', 'R2', 'CAPT', 'FO'].includes(token) ||
    token.startsWith('BIN-') ||
    token.startsWith('CYL-') ||
    /^(LH|RH)-[1-9]$/.test(token),
  );

  const weakLocationCount = tokens.filter((token) => ['FWD', 'AFT', 'LH', 'RH', 'CTR'].includes(token)).length;

  if (hasStrongToken) {
    return {
      position: tokens.join('-'),
      confidence: 'high',
      rule: 'token-explicito',
      tokens,
    };
  }

  if (weakLocationCount >= 2) {
    return {
      position: tokens.join('-'),
      confidence: 'medium',
      rule: 'ubicacion-compuesta',
      tokens,
    };
  }

  if (weakLocationCount === 1) {
    return {
      position: tokens.join('-'),
      confidence: 'low',
      rule: 'ubicacion-parcial',
      tokens,
    };
  }

  return {
    position: null,
    confidence: 'manual',
    rule: null,
    tokens: [],
  };
}

function buildWarnings(row: ParsedRow, suggestion: HardTimePositionSuggestion): string[] {
  const warnings: string[] = [];

  if (!row.part_number) warnings.push('Sin part number');
  if (!row.serial_number) warnings.push('Sin serial number');
  if (row.control === 'UNKNOWN') warnings.push('Control no identificado');
  if (row.limit_value === null) warnings.push('Límite no identificado');
  if (!row.last_value) warnings.push('Sin último cumplimiento');
  if (suggestion.confidence !== 'high') warnings.push('Posición requiere revisión');

  return warnings;
}

function parseWorkbook(workbook: XLSX.WorkBook): HardTimeImportPreview {
  const sheets = workbook.SheetNames.filter((sheetName) => /^INAC 43-004/.test(sheetName));

  if (sheets.length === 0) {
    throw new Error('No se encontraron hojas INAC 43-004 en el archivo.');
  }

  const dedupedRows = new Map<string, ParsedRow>();

  for (const sheetName of sheets) {
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) continue;

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      blankrows: false,
      defval: '',
    }) as string[][];

    let currentComponent:
      | {
          description: string;
          part_number: string | null;
          serial_number: string | null;
          reference: string | null;
        }
      | null = null;

    let inTable = false;

    for (const row of rows) {
      const description = cleanDescription(row[0]);
      const partNumber = normalizeWhitespace(row[1]);
      const serialNumber = normalizeWhitespace(row[2]);
      const reference = normalizeWhitespace(row[3]);
      const taskDescription = cleanDescription(row[6]);

      if (isHeaderRow(description, partNumber, taskDescription)) {
        inTable = true;
        continue;
      }

      if (!inTable) continue;

      const limitValue = parseLocalizedNumber(row[4]);
      const hasSignals = Boolean(description || taskDescription || limitValue !== null || normalizeWhitespace(row[7]));

      if (!hasSignals) continue;

      if (description && shouldIgnoreDescription(description)) continue;

      if (description) {
        currentComponent = {
          description,
          part_number: partNumber || null,
          serial_number: serialNumber || null,
          reference: reference || null,
        };
      }

      if (!currentComponent) continue;

      const control = inferControl(row[5], row[23]);
      const parsedRow: ParsedRow = {
        description: currentComponent.description,
        part_number: currentComponent.part_number,
        serial_number: currentComponent.serial_number,
        reference: currentComponent.reference,
        task_description: taskDescription || currentComponent.description,
        control,
        limit_value: limitValue,
        interval_hours: control === 'HORAS' ? limitValue : null,
        interval_cycles: control === 'CICLOS' ? limitValue : null,
        interval_days: control === 'DIAS' ? limitValue : null,
        last_value: normalizeWhitespace(row[7]) || null,
        next_value: normalizeWhitespace(row[9]) || null,
        expiry_date: normalizeWhitespace(row[13]) || null,
        remanent_value: parseLocalizedNumber(row[14]),
        status_label: normalizeWhitespace(row[16]) || null,
        performed_by: normalizeWhitespace(row[11]) || null,
        airframe_hours: parseLocalizedNumber(row[17]),
        airframe_cycles: parseLocalizedNumber(row[18]),
        airframe_date: normalizeWhitespace(row[19]) || null,
        source_sheet: sheetName,
      };

      const dedupeKey = JSON.stringify([
        parsedRow.description,
        parsedRow.part_number,
        parsedRow.serial_number,
        parsedRow.task_description,
        parsedRow.control,
        parsedRow.limit_value,
      ]);

      const existing = dedupedRows.get(dedupeKey);

      if (!existing) {
        dedupedRows.set(dedupeKey, parsedRow);
        continue;
      }

      const existingScore =
        (existing.airframe_hours ?? -1) * 1_000_000 +
        (existing.airframe_cycles ?? -1) * 100 +
        (existing.remanent_value ?? -1);
      const candidateScore =
        (parsedRow.airframe_hours ?? -1) * 1_000_000 +
        (parsedRow.airframe_cycles ?? -1) * 100 +
        (parsedRow.remanent_value ?? -1);

      if (candidateScore > existingScore) {
        dedupedRows.set(dedupeKey, parsedRow);
      }
    }
  }

  const componentsMap = new Map<string, HardTimeImportComponentPreview>();

  for (const row of dedupedRows.values()) {
    const componentKey = JSON.stringify([row.description, row.part_number, row.serial_number]);
    const suggestion = inferHardTimePosition(row.description);

    if (!componentsMap.has(componentKey)) {
      componentsMap.set(componentKey, {
        description: row.description,
        part_number: row.part_number,
        serial_number: row.serial_number,
        reference: row.reference,
        position_suggestion: suggestion,
        warnings: buildWarnings(row, suggestion),
        intervals: [],
      });
    }

    componentsMap.get(componentKey)?.intervals.push({
      task_description: row.task_description,
      control: row.control,
      interval_hours: row.interval_hours,
      interval_cycles: row.interval_cycles,
      interval_days: row.interval_days,
      limit_value: row.limit_value,
      last_value: row.last_value,
      next_value: row.next_value,
      expiry_date: row.expiry_date,
      remanent_value: row.remanent_value,
      status_label: row.status_label,
      performed_by: row.performed_by,
      airframe_hours: row.airframe_hours,
      airframe_cycles: row.airframe_cycles,
      airframe_date: row.airframe_date,
      source_sheet: row.source_sheet,
    });
  }

  const components = Array.from(componentsMap.values()).sort((a, b) =>
    a.description.localeCompare(b.description),
  );

  const positionConfidence: Record<HardTimePositionConfidence, number> = {
    high: 0,
    medium: 0,
    low: 0,
    manual: 0,
  };

  const byControl: Record<HardTimeImportControl, number> = {
    HORAS: 0,
    CICLOS: 0,
    DIAS: 0,
    UNKNOWN: 0,
  };

  for (const component of components) {
    positionConfidence[component.position_suggestion.confidence] += 1;

    for (const interval of component.intervals) {
      byControl[interval.control] += 1;
    }
  }

  return {
    sheets,
    components,
    summary: {
      component_count: components.length,
      interval_count: components.reduce((total, component) => total + component.intervals.length, 0),
      position_confidence: positionConfidence,
      by_control: byControl,
      manual_review_count: components.filter(
        (component) => component.position_suggestion.confidence !== 'high',
      ).length,
    },
  };
}

export async function processHardTimeExcelImport(file: File): Promise<HardTimeImportPreview> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { cellDates: false });
  return parseWorkbook(workbook);
}
