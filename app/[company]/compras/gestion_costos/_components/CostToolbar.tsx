import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

type Props = {
  search: string
  setSearch: (value: string) => void
}

const CostToolbar = ({ search, setSearch }: Props) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative ml-auto">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar artículo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs w-64"
        />
      </div>
    </div>
  )
}

export default CostToolbar