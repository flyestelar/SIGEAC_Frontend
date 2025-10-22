import { IWarehouseArticle } from "@/hooks/mantenimiento/almacen/renglones/useGetArticlesByCategory";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface ArticleChanges {
  quantities: Record<number, number>;
  zones: Record<number, string>;
  hasChanges: boolean;
}

export interface ArticleChangeActions {
  handleQuantityChange: (articleId: number, newQuantity: string) => void;
  handleZoneChange: (articleId: number, newZone: string) => void;
  resetChanges: () => void;
}

export interface ModifiedArticle {
  articleId: number;
  newCost: number;
  costChanged: boolean;
}

export const useArticleChanges = (batches: IWarehouseArticle[] | undefined) => {
  const [costs, setCosts] = useState<Record<number, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize quantities and zones when articles are loaded
  useEffect(() => {
    if (batches && Array.isArray(batches)) {
      const initialCosts: Record<number, number> = {};
      batches.forEach((batch) => {
        if (batch && batch.articles && Array.isArray(batch.articles)) {
          batch.articles.forEach((article) => {
            initialCosts[article.id] = Number(article.cost) || 0;
          });
        }
      });
      setCosts(initialCosts);
    }
  }, [batches]);

  const handleCostChange = useCallback(
    (articleId: number, newCost: string) => {
      setCosts((prev) => ({
        ...prev,
        [articleId]: Number(newCost),
      }));
      setHasChanges(true);
    },
    []
  );

  const resetChanges = useCallback(() => {
    setHasChanges(false);
    if (batches && Array.isArray(batches)) {
      const initialCosts: Record<number, number> = {};
      batches.forEach((batch) => {
        if (batch && batch.articles && Array.isArray(batch.articles)) {
          batch.articles.forEach((article) => {
            initialCosts[article.id] = article.quantity || 0;
          });
        }
      });
      setCosts(initialCosts);
    }
  }, [batches]);

  // Función para obtener artículos modificados
  const getModifiedArticles = useCallback((): ModifiedArticle[] => {
    const modifiedArticles: ModifiedArticle[] = [];

    if (!batches || !Array.isArray(batches)) {
      return modifiedArticles;
    }

    batches.forEach((batch) => {
      if (!batch || !batch.articles || !Array.isArray(batch.articles)) {
        return;
      }

      batch.articles.forEach((article) => {
        const currenCost = costs[article.id] ?? article.cost;

        const costChanged = currenCost !== (article.cost || 0);

        if (costChanged) {
          modifiedArticles.push({
            articleId: article.id,
            newCost: currenCost,
            costChanged,
          });
        }
      });
    });

    return modifiedArticles;
  }, [costs, batches]);

  // Número de artículos modificados
  const modifiedCount = useMemo(
    () => getModifiedArticles().length,
    [getModifiedArticles]
  );

  return {
    state: {
      costs,
      hasChanges,
    },
    actions: {
      handleCostChange,
      resetChanges,
    },
    utils: {
      getModifiedArticles,
      modifiedCount,
    },
  };
};
