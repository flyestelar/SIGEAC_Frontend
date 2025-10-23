// ===== Tipos de entrada mínimos
type InBatch = {
  id: number;
  name: string;
  category: string;
  medition_unit?: string;
  warehouse_id?: number | string;
  warehouse_name?: string;
  min_quantity?: number | string;
  is_hazardous?: boolean;
};

type InArticle = {
  id: number;
  part_number: string;
  alternative_part_number?: string[];
  description?: string;
  serial?: string;
  quantity: number | string;
  zone: string;
  condition: string; // texto
  status: string;
  cost?: number;
  lot_number?: string;
  tool?: any;
};

type InItem = { batch: InBatch; articles: InArticle[] };

// ===== Tipo de salida (como tu 1ª imagen)
type OutCondition = { id: number; name: string };

type OutArticle = {
  id: number;
  part_number: string;
  alternative_part_number?: string[];
  serial?: string;
  lot_number?: string;
  description?: string;
  quantity: number;
  zone: string;
  condition: OutCondition;
  status: string;
  cost: string;
  tool?: any;
  article_type?: string;
};

type OutBatch = {
  batch_id: number;
  name: string;
  medition_unit?: string;
  category: 'CONSUMIBLE' | 'COMPONENTE' | 'HERRAMIENTA';
  is_hazardous: boolean;
  article_count: number;
  articles: OutArticle[];
};

const mapCategory = (c?: string): OutBatch['category'] => {
  switch ((c || '').toUpperCase()) {
    case 'CONSUMABLE':
    case 'CONSUMIBLE':
      return 'CONSUMIBLE';
    case 'COMPONENT':
    case 'COMPONENTE':
      return 'COMPONENTE';
    case 'TOOL':
    case 'HERRAMIENTA':
      return 'HERRAMIENTA';
    default:
      return 'COMPONENTE';
  }
};

const mapCondition = (name?: string): OutCondition => ({ id: 0, name: name || 'SIN ESTADO' });

// ===== Mapper principal con agrupación por batch
export function mapAndGroupByBatch(items: InItem[]): OutBatch[] {
  const byBatch = new Map<number, OutBatch>();
  for (const { batch, articles } of items) {
    const key = batch.id;

    if (!byBatch.has(key)) {
      byBatch.set(key, {
        batch_id: batch.id,
        name: batch.name,
        medition_unit: batch.medition_unit,
        category: mapCategory(batch.category),
        is_hazardous: Boolean(batch.is_hazardous),
        article_count: 0,
        articles: [],
      });
    }

    const acc = byBatch.get(key)!;

    for (const a of articles) {
      const outA: OutArticle = {
        id: a.id,
        part_number: a.part_number,
        alternative_part_number: a.alternative_part_number ? a.alternative_part_number : undefined,
        serial: a.serial ?? undefined,
        lot_number: a.lot_number ?? undefined,
        description: a.description ?? undefined,
        quantity: Number(a.quantity ?? 0),
        zone: a.zone,
        condition: mapCondition(a.condition),
        status: a.status,
        cost: a.cost == null ? '0' : String(a.cost),
        tool: a.tool ?? null,
      };

      acc.articles.push(outA);
      acc.article_count += 1;
    }
  }

  return Array.from(byBatch.values());
}
