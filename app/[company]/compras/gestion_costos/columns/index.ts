'use client'

import { ColumnDef } from '@tanstack/react-table'
import { getArticleCostColumns } from './article-cost.columns'
import { getGeneralCostColumns } from './general-cost.columns'

type CostType = 'ARTICLE' | 'GENERAL'

type DraftValue = string | number | undefined

type BuildColumnsArgs = {
  type: CostType
  costDrafts: Record<number, DraftValue>
  onCostChange: (id: number, value: string) => void
}

export const getColumns = ({
  type,
  costDrafts,
  onCostChange,
}: BuildColumnsArgs): ColumnDef<any>[] => {
  if (type === 'GENERAL') {
    return getGeneralCostColumns({
      costDrafts,
      onCostChange,
    })
  }

  return getArticleCostColumns({
    costDrafts,
    onCostChange,
  })
}