import { Input } from '@/components/ui/input';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { IWarehouseArticle } from '@/hooks/mantenimiento/almacen/renglones/useGetArticlesByCategory';

// Tipo para artículos individuales
export type Article = IWarehouseArticle['articles'][0];

interface ArticleRowProps {
  article: Article;
  cost: number | string; // valor controlado desde el padre (puede venir pre-cargado)
  onCostChange: (articleId: number, newCost: string) => void;
  className?: string;
}

// Utilidad para formato de moneda
const formatMoney = (v: number | undefined | null) => {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  if (Number.isNaN(n)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
};

// Parseo tolerante (coma o punto)
const toNumber = (s: string) => {
  if (s.trim() === '') return NaN;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

export function ArticleRow({ article, cost, onCostChange, className }: ArticleRowProps) {
  const inputId = useId();

  // Estado local como string para permitir "1", "1.", "", etc.
  const [draft, setDraft] = useState(() => (cost === '' || cost == null ? '' : String(cost)));

  // Evitar que el prop "cost" pise el draft mientras se edita
  const isEditing = useRef(false);

  useEffect(() => {
    if (!isEditing.current) {
      setDraft(cost === '' || cost == null ? '' : String(cost));
    }
  }, [cost]);

  const { current, next, changed, delta } = useMemo(() => {
    const current = Number(article?.cost ?? 0);
    const next = toNumber(draft);
    const changed = !Number.isNaN(next) && next !== current;
    const delta = changed ? next - current : 0;
    return { current, next, changed, delta };
  }, [article?.cost, draft]);

  const handleFocus = () => {
    isEditing.current = true;
  };

  const handleBlur = () => {
    isEditing.current = false;
    const n = toNumber(draft.trim());
    // Propaga solo números válidos. Si no es válido, manda ''.
    onCostChange(article.id, Number.isFinite(n) ? String(n) : '');
  };

  return (
    <div
      role="group"
      aria-label={`Artículo ${article?.part_number ?? ''}`}
      className={[
        'flex flex-col lg:flex-row items-center gap-3 rounded-xl border bg-card p-4 transition-colors',
        changed ? 'ring-1 ring-orange-400/60 bg-orange-50/30' : 'hover:bg-muted/40',
        className,
      ].join(' ')}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Info principal */}
      <div className="flex min-w-0 w-full flex-col">
        <span className="text-[11px] font-medium text-muted-foreground">Artículo</span>
        <div className="mt-1 rounded-lg border bg-muted/40 p-2">
          <div className="truncate text-sm font-medium" title={article.description || ''}>
            {article.description}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            PN: <span className="font-mono">{article.part_number}</span>
          </div>
          <div className="text-xs text-muted-foreground">Serial: {article.serial || 'N/A'}</div>
        </div>
      </div>

      {/* Costo actual */}
      <div className="flex flex-col w-full">
        <span className="text-[11px] font-medium text-muted-foreground">Costo actual</span>
        <div className="mt-1 flex items-center justify-between rounded-lg border bg-muted/40 p-2">
          <span className="text-base font-semibold tabular-nums">{formatMoney(current)}</span>
          {changed ? (
            <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              Δ {delta > 0 ? '+' : ''}
              {delta.toFixed(2)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Nuevo costo */}
      <div className="flex flex-col w-full">
        <label htmlFor={inputId} className="text-[11px] font-medium text-muted-foreground">
          Nuevo costo
        </label>
        <div className="mt-1 flex items-center gap-2">
          <Input
            id={inputId}
            type="text" // permite estados intermedios
            inputMode="decimal" // teclado numérico en móviles
            pattern="[0-9]*[.,]?[0-9]*"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={['h-9 text-right tabular-nums', changed ? 'border-orange-500/70 bg-orange-50' : ''].join(' ')}
            placeholder="0.00"
            aria-invalid={changed ? true : undefined}
            aria-describedby={changed ? `${inputId}-hint` : undefined}
          />
          <span className="select-none text-xs text-muted-foreground">USD</span>
        </div>

        {/* Hint de cambio */}
        {changed ? (
          <p id={`${inputId}-hint`} className="mt-1 text-[11px] text-orange-700">
            Cambiará de {formatMoney(current)} a {formatMoney(next)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
