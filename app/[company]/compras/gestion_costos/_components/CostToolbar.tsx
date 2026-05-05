'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

type Props = {
  search: string
  setSearch: (value: string) => void
  placeholder?: string
}

const CostToolbar = ({
  search,
  setSearch,
  placeholder = 'Buscar artículo o general...'
}: Props) => {
  return (
    <div className="flex items-center justify-end gap-2">

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="
            pl-8 h-8 text-xs
            bg-background
            border-border
            focus-visible:ring-1
            focus-visible:ring-amber-500/40
          "
        />
      </div>
    </div>
  )
}

export default CostToolbar