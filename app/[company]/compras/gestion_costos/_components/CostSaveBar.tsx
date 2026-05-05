'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Check, Save } from 'lucide-react'

type Props = {
  hasChanges: boolean
  modifiedCount: number
  onSave: () => void
  loading?: boolean
}

const CostSaveBar = ({
  hasChanges,
  modifiedCount,
  onSave,
  loading,
}: Props) => {
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border bg-background/95 backdrop-blur px-4 py-2 shadow-lg transition-all',
        hasChanges ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-amber-500" />

        <span className="text-xs font-medium">
          Cambios detectados
        </span>

        <Badge variant="secondary" className="text-[10px]">
          {modifiedCount}
        </Badge>
      </div>

      <Button
        size="sm"
        className="h-8 gap-2 text-xs"
        onClick={onSave}
        disabled={loading || !hasChanges}
      >
        <Save className="h-3.5 w-3.5" />
        Guardar costos
      </Button>
    </div>
  )
}

export default CostSaveBar