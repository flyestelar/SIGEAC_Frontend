import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IWarehouseArticle } from '@/hooks/mantenimiento/almacen/renglones/useGetArticlesByCategory';

export interface ModifiedArticle {
  articleId: number;
  cost: number;
  costChanged: boolean;
}

export const useArticleChanges = (batches: IWarehouseArticle[] | undefined) => {
  // edits guarda el valor crudo que escribe el usuario por artículo
  const [edits, setEdits] = useState<Record<number, string>>({});

  // baseline de costos desde el backend
  const baselineCosts = useMemo(() => {
    const map: Record<number, number> = {};
    if (Array.isArray(batches)) {
      for (const b of batches) {
        if (!b?.articles) continue;
        for (const a of b.articles) map[a.id] = Number(a.cost) || 0;
      }
    }
    return map;
  }, [batches]);

  // reinicia ediciones si cambia la data base
  useEffect(() => setEdits({}), [baselineCosts]);

  // valor que verá el input: edición cruda si existe, si no baseline
  const costs: Record<number, number | string> = useMemo(() => {
    const out: Record<number, number | string> = {};
    for (const idStr of Object.keys(baselineCosts)) {
      const id = Number(idStr);
      out[id] = id in edits ? edits[id] : baselineCosts[id];
    }
    return out;
  }, [baselineCosts, edits]);

  const handleCostChange = useCallback((articleId: number, newCost: string) => {
    setEdits((prev) => ({ ...prev, [articleId]: newCost }));
  }, []);

  const resetChanges = useCallback(() => setEdits({}), []);

  const getModifiedArticles = useCallback((): ModifiedArticle[] => {
    const mods: ModifiedArticle[] = [];
    for (const [idStr, raw] of Object.entries(edits)) {
      const articleId = Number(idStr);
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) continue;
      const base = baselineCosts[articleId] ?? 0;
      if (parsed !== base) {
        mods.push({ articleId, cost: parsed, costChanged: true });
      }
    }
    return mods;
  }, [edits, baselineCosts]);

  const modifiedCount = useMemo(() => getModifiedArticles().length, [getModifiedArticles]);
  const hasChanges = modifiedCount > 0;

  return {
    state: { costs, hasChanges },
    actions: { handleCostChange, resetChanges },
    utils: { getModifiedArticles, modifiedCount },
  };
};
