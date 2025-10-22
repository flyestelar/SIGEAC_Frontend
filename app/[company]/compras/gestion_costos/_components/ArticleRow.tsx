import { Input } from '@/components/ui/input';
import { IWarehouseArticle } from '@/hooks/mantenimiento/almacen/renglones/useGetArticlesByCategory';
import React from 'react';
import { SearchableZoneSelect } from './SearchableZoneSelect';

// Tipo para artículos individuales
export type Article = IWarehouseArticle['articles'][0];

interface ArticleRowProps {
  article: Article;
  cost: number | string;
  onCostChange: (articleId: number, newQuantity: string) => void;
}
// Componente memozado para artículos individuales
export const ArticleRow = React.memo(({ article, cost, onCostChange }: ArticleRowProps) => {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Article Info */}
      <div className="flex flex-col">
        <label className="text-xs font-medium text-muted-foreground mb-1">Artículo</label>
        <div className="p-2 bg-muted rounded-md">
          <div className="font-medium text-sm">{article.description}</div>
          <div className="text-xs text-muted-foreground">{article.part_number}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Serial: {article.serial || 'N/A'}</div>
        </div>
      </div>

      {/* Current Cost */}
      <div className="flex flex-col">
        <label className="text-xs font-medium text-muted-foreground mb-1">Costo Actual</label>
        <div className="p-2 bg-muted rounded-md text-center">
          <div className="text-xl font-bold text-primary">{article.cost || 0}</div>
        </div>
      </div>

      {/* New Quantity */}
      <div className="flex flex-col">
        <label className="text-xs font-medium text-muted-foreground mb-1">Nuevo Costo</label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={cost || ''}
          onChange={(e) => onCostChange(article.id, e.target.value)}
          className={`text-center text-base font-medium h-9 ${
            cost !== (article.cost || 0) ? 'border-orange-500 bg-orange-50' : ''
          }`}
          placeholder="0"
        />
      </div>
    </div>
  );
});

ArticleRow.displayName = 'ArticleRow';
