'use client'

import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

type CostType = 'ARTICLE' | 'GENERAL'

type Category = 'ALL' | 'COMPONENTE' | 'CONSUMIBLE' | 'HERRAMIENTA'

type Props = {
  type: CostType
  setType: (type: CostType) => void

  category: Category
  setCategory: (category: Category) => void
}

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */

const categories: Category[] = [
  'ALL',
  'COMPONENTE',
  'CONSUMIBLE',
  'HERRAMIENTA',
]

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */

const CostTypeToggle = ({
  type,
  setType,
  category,
  setCategory,
}: Props) => {
  return (
    <div className="flex flex-col gap-2">

      {/* TYPE SWITCH */}
      <div className="flex rounded-md border border-border overflow-hidden w-fit">

        <button
          onClick={() => setType('ARTICLE')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            type === 'ARTICLE'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60'
              : 'bg-background text-muted-foreground hover:bg-muted/50'
          )}
        >
          Artículos
        </button>

        <button
          onClick={() => {
            setType('GENERAL')
            setCategory('ALL')
          }}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            type === 'GENERAL'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60'
              : 'bg-background text-muted-foreground hover:bg-muted/50'
          )}
        >
          General / Ferretería
        </button>
      </div>

      {/* CATEGORY FILTER */}
      {type === 'ARTICLE' && (
        <div className="flex rounded-md border border-border overflow-hidden w-fit">

          {categories.map((cat) => {
            const isActive = category === cat

            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium border-r last:border-r-0 transition-colors',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted/40'
                )}
              >
                {cat}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CostTypeToggle