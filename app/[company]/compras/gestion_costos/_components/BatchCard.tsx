import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArticleRow } from './ArticleRow';
import { IWarehouseArticle } from '@/hooks/mantenimiento/almacen/renglones/useGetArticlesByCategory';

interface BatchCardProps {
  batch: IWarehouseArticle;
  onCostChange: (articleId: number, newCost: string) => void;
}

export const BatchCard = React.memo(({ batch, onCostChange }: BatchCardProps) => {
  return (
    <Card className="mb-5" onClick={(e) => e.stopPropagation()}>
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-lg">{batch.name}</CardTitle>
        <CardDescription className="text-sm">
          {batch.articles.length} artículo
          {batch.articles.length !== 1 ? 's' : ''} en este batch
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="space-y-3">
          {batch.articles.map((article) => (
            <ArticleRow cost={article.cost} key={article.id} article={article} onCostChange={onCostChange} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

BatchCard.displayName = 'BatchCard';
