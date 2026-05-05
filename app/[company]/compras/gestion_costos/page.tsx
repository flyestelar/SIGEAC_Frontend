'use client'

import React, { useMemo, useState, useCallback, useDeferredValue } from 'react'

import { ContentLayout } from '@/components/layout/ContentLayout'
import LoadingPage from '@/components/misc/LoadingPage'
import BackButton from '@/components/misc/BackButton'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import { useCompanyStore } from '@/stores/CompanyStore'

import { DataTable } from './data-table'
import { getColumns } from './columns'

import CostToolbar from './_components/CostToolbar'
import CostTypeToggle from './_components/CostTypeToggle'
import CostSaveBar from './_components/CostSaveBar'

import { useCostDrafts } from './hooks/useCostDrafts'

import { useGetAllWarehouseArticlesByCategory } from '@/hooks/mantenimiento/almacen/articulos/useGetWarehouseArticlesByCategory'
import { useGetGeneralArticles } from '@/hooks/mantenimiento/almacen/almacen_general/useGetGeneralArticles'

import {
  useBulkUpdateArticleCost,
  useBulkUpdateGeneralCost,
} from '@/actions/mantenimiento/compras/gestion_costos/actions'

type CostType = 'ARTICLE' | 'GENERAL'
type Category = 'all' | 'COMPONENT' | 'PART' | 'CONSUMABLE' | 'TOOL'

type BaseRow = {
  id: number
  cost?: number
  batch_name?: string
  part_number?: string
  serial?: string
  quantity?: number
  name?: string
  description?: string
  brand_model?: string
  variant_type?: string
}

/* ─────────────────────────────────────────────
   🔥 TABLE MEMO (FIX REAL DE RE-RENDER)
───────────────────────────────────────────── */

const TableSection = React.memo(function TableSection({
  columns,
  data,
  loading,
  type,
  category,
}: any) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      type={type}
      category={category}
    />
  )
})

/* ───────────────────────────────────────────── */

const CostManagementPage = () => {
  const { selectedCompany } = useCompanyStore()

  const [type, setType] = useState<CostType>('ARTICLE')
  const [category, setCategory] = useState<Category>('all')
  const [search, setSearch] = useState('')

  const deferredSearch = useDeferredValue(search)

  const { data: warehouseData, isLoading: loadingArticles } =
    useGetAllWarehouseArticlesByCategory(
      category === 'all' ? 'all' : category,
      type === 'ARTICLE'
    )

  const { data: generalArticles, isLoading: loadingGeneral } =
    useGetGeneralArticles()

  const isLoading =
    type === 'ARTICLE' ? loadingArticles : loadingGeneral

  const articleData = useMemo<BaseRow[]>(() => {
    if (!warehouseData?.batches) return []

    return warehouseData.batches.flatMap((batch) =>
      batch.articles.map((article) => ({
        id: article.id,
        batch_name: batch.name,
        part_number: article.part_number,
        serial: article.serial,
        cost: Number(article.cost ?? 0),
      }))
    )
  }, [warehouseData])

  const baseData = useMemo<BaseRow[]>(() => {
    if (type === 'GENERAL') {
      return (generalArticles ?? []).map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        brand_model: a.brand_model,
        variant_type: a.variant_type,
        cost: Number(a.cost ?? 0),
      }))
    }

    return articleData
  }, [type, generalArticles, articleData])

  const filteredData = useMemo<BaseRow[]>(() => {
    if (!deferredSearch.trim()) return baseData

    const q = deferredSearch.toLowerCase()

    return baseData.filter((item: any) => {
      if (type === 'ARTICLE') {
        return (
          item.part_number?.toLowerCase?.().includes(q) ||
          item.batch_name?.toLowerCase?.().includes(q)
        )
      }

      return (
        item.name?.toLowerCase?.().includes(q) ||
        item.description?.toLowerCase?.().includes(q) ||
        item.brand_model?.toLowerCase?.().includes(q) ||
        item.variant_type?.toLowerCase?.().includes(q)
      )
    })
  }, [baseData, deferredSearch, type])

  const {
    drafts: costDrafts,
    hasChanges,
    onCostChange,
    setDrafts,
    getChangedRows,
  } = useCostDrafts<BaseRow>({
    data: filteredData,
  })

  const changedCount = useMemo(
    () => getChangedRows().length,
    [getChangedRows]
  )

  const resetAll = useCallback(() => {
    setDrafts({})
  }, [setDrafts])

  const bulkArticleMutation = useBulkUpdateArticleCost()
  const bulkGeneralMutation = useBulkUpdateGeneralCost()

  const handleSave = useCallback(() => {
    const updates = Object.entries(costDrafts).map(([id, value]) => ({
      id: Number(id),
      cost: Number(value),
    }))

    if (!updates.length) return

    const payload = {
      company: selectedCompany?.slug!,
      updates,
    }

    if (type === 'ARTICLE') {
      bulkArticleMutation.mutate(payload, {
        onSuccess: resetAll,
      })
    } else {
      bulkGeneralMutation.mutate(payload, {
        onSuccess: resetAll,
      })
    }
  }, [
    costDrafts,
    type,
    selectedCompany,
    bulkArticleMutation,
    bulkGeneralMutation,
    resetAll,
  ])

  const columns = useMemo(
    () =>
      getColumns({
        type,
        costDrafts,
        onCostChange,
      }),
    [type, costDrafts, onCostChange]
  )

  if (isLoading) return <LoadingPage />

  return (
    <ContentLayout title="Gestión de Costos">
      <div className="flex flex-col gap-4">

        {/* HEADER (NO RELEVANTE PARA PERF) */}
        <div className="flex items-center gap-2">
          <BackButton iconOnly variant="secondary" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${selectedCompany?.slug}/dashboard`}>
                  Inicio
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />
              <BreadcrumbItem>Compras</BreadcrumbItem>
              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>Gestión de Costos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">Gestión de Costos</h1>

          <span className="text-xs text-muted-foreground tabular-nums">
            {filteredData.length} registros
          </span>
        </div>

        <p className="text-xs text-muted-foreground italic">
          Edición de costos unitarios para artículos y ferretería.
        </p>

        <CostTypeToggle
          type={type}
          setType={setType}
          category={category}
          setCategory={setCategory}
        />

        <CostToolbar search={search} setSearch={setSearch} />

        <CostSaveBar
          hasChanges={hasChanges}
          modifiedCount={changedCount}
          onSave={handleSave}
        />

        <TableSection
          columns={columns}
          data={baseData}
          loading={isLoading}
          type={type}
          category={category}
        />

      </div>
    </ContentLayout>
  )
}

export default CostManagementPage