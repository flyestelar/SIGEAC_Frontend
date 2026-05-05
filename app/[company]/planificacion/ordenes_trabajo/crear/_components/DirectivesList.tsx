'use client';

import { useMemo, useState } from 'react';
import { AirworthinessDirectiveResource } from '@api/types';
import { AlertCircle, Calendar, FileText, Loader2, RefreshCw, Search, ShieldCheck, Sigma } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DirectivesListProps {
  directives: AirworthinessDirectiveResource[];
  selectedDirectiveIds: Set<number>;
  onToggleDirective: (id: number) => void;
  onToggleGroup: (ids: number[]) => void;
  isLoading: boolean;
}

type GroupedByAuthority = {
  authority: string;
  items: AirworthinessDirectiveResource[];
};

const DirectivesList = ({
  directives,
  selectedDirectiveIds,
  onToggleDirective,
  onToggleGroup,
  isLoading,
}: DirectivesListProps) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo<AirworthinessDirectiveResource[]>(() => {
    const search = query.trim().toLowerCase();
    if (!search) return directives;
    return directives.filter((d) => {
      const haystack = [d.ad_number, d.authority, d.subject_description]
        .filter(Boolean)
        .map((v) => v!.toLowerCase());
      return haystack.some((v) => v.includes(search));
    });
  }, [directives, query]);

  const grouped = useMemo<GroupedByAuthority[]>(() => {
    const map = new Map<string, AirworthinessDirectiveResource[]>();
    for (const d of filtered) {
      const key = d.authority ?? 'Sin autoridad';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return Array.from(map.entries())
      .map(([authority, items]) => ({ authority, items }))
      .sort((a, b) => a.authority.localeCompare(b.authority));
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center gap-3 px-5 py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando directivas de aeronavegabilidad…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Directivas de Aeronavegabilidad
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {filtered.length} directiva{filtered.length !== 1 ? 's' : ''} aplicable
            {filtered.length !== 1 ? 's' : ''} · agrupadas por autoridad
          </p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar directivas…"
            className="h-8 bg-muted/20 pl-9 text-sm"
          />
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-16 text-muted-foreground">
          <Sigma className="size-8 opacity-20" />
          <p className="text-sm">
            {query
              ? `Sin resultados para "${query}"`
              : 'No hay directivas de aeronavegabilidad aplicables para esta aeronave.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => {
            const groupIds = group.items.map((d) => d.id);
            const selectedInGroup = groupIds.filter((id) => selectedDirectiveIds.has(id)).length;
            const allSelected = selectedInGroup > 0 && selectedInGroup === groupIds.length;
            const someSelected = selectedInGroup > 0 && selectedInGroup < groupIds.length;

            return (
              <div key={group.authority} className="overflow-hidden rounded-lg border bg-background">
                <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-2.5">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={() => onToggleGroup(groupIds)}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">
                      {group.authority}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] tabular-nums">
                    {selectedInGroup}/{groupIds.length}
                  </Badge>
                </div>

                <div className="divide-y">
                  {group.items.map((directive) => {
                    const isSelected = selectedDirectiveIds.has(directive.id);

                    return (
                      <label
                        key={directive.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors',
                          isSelected ? 'bg-violet-500/5' : 'hover:bg-muted/20',
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleDirective(directive.id)}
                          className="mt-0.5 shrink-0"
                        />

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-semibold">{directive.ad_number}</span>
                                {directive.is_recurring && (
                                  <Badge
                                    variant="outline"
                                    className="h-4 border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] text-amber-600 dark:text-amber-400"
                                  >
                                    <RefreshCw className="mr-1 size-2.5" />
                                    Recurrente
                                  </Badge>
                                )}
                                {directive.pdf_document_url && (
                                  <Badge
                                    variant="outline"
                                    className="h-4 border-sky-500/30 bg-sky-500/10 px-1.5 text-[10px] text-sky-600 dark:text-sky-400"
                                  >
                                    <FileText className="mr-1 size-2.5" />
                                    PDF
                                  </Badge>
                                )}
                              </div>
                              {directive.subject_description && (
                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                  {directive.subject_description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                            {directive.effective_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                <span>
                                  Vigente:{' '}
                                  {format(new Date(directive.effective_date), 'dd MMM yyyy', { locale: es })}
                                </span>
                              </span>
                            )}
                            {directive.summary && (
                              <>
                                {directive.effective_date && <span className="text-border">·</span>}
                                <span className="flex items-center gap-1">
                                  <ShieldCheck className="size-3" />
                                  {directive.summary.applicable_aircraft_count} aeronave
                                  {directive.summary.applicable_aircraft_count !== 1 ? 's' : ''}
                                </span>
                                {directive.summary.open_controls_count > 0 && (
                                  <>
                                    <span className="text-border">·</span>
                                    <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                      <AlertCircle className="size-3" />
                                      {directive.summary.open_controls_count} control
                                      {directive.summary.open_controls_count !== 1 ? 'es' : ''} abierto
                                      {directive.summary.open_controls_count !== 1 ? 's' : ''}
                                    </span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DirectivesList;
