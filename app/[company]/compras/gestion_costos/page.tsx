'use client'

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
import { useMemo, useState } from 'react'
import { useGetAllWarehouseArticlesByCategory } from '@/hooks/mantenimiento/almacen/articulos/useGetWarehouseArticlesByCategory'
import { useGetGeneralArticles } from '@/hooks/mantenimiento/almacen/almacen_general/useGetGeneralArticles'
import { getColumns } from './columns'
import { DataTable } from './data-table'
import CostToolbar from './_components/CostToolbar'
import CostTypeToggle from './_components/CostTypeToggle'

type CostType = 'ARTICLE' | 'GENERAL'
type Category = 'ALL' | 'COMPONENTE' | 'CONSUMIBLE' | 'HERRAMIENTA'

const CostManagementPage = () => {
  const { selectedCompany } = useCompanyStore()

  const [type, setType] = useState<CostType>('ARTICLE')
  const [category, setCategory] = useState<Category>('ALL')
  const [search, setSearch] = useState('')

  const {
    data: warehouseData,
    isLoading: loadingArticles,
  } = useGetAllWarehouseArticlesByCategory(
    category === 'ALL' ? 'all' : category,
    type === 'ARTICLE'
  )

  const {
    data: generalArticles,
    isLoading: loadingGeneral,
  } = useGetGeneralArticles()

  const isLoading =
    type === 'ARTICLE' ? loadingArticles : loadingGeneral

  const flatArticles = useMemo(() => {
    if (!warehouseData?.batches) return []

    return warehouseData.batches.flatMap(batch =>
      batch.articles.map(article => ({
        ...article,
        batch_name: batch.name,
        batch_id: batch.batch_id,
      }))
    )
  }, [warehouseData])

    const filteredData = useMemo(() => {
    const baseData =
        type === 'ARTICLE'
        ? flatArticles
        : generalArticles ?? []

    if (!search.trim()) return baseData

    const q = search.toLowerCase()

    return baseData.filter((item: any) =>
        item.part_number?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    )
    }, [type, flatArticles, generalArticles, search])

  const columns = getColumns({
    type,
    company: selectedCompany?.slug ?? '',
  })

  if (isLoading) return <LoadingPage />

  return (
    <ContentLayout title="Gestión de Costos">
      <div className="flex flex-col gap-y-3">

        <div className="flex items-center gap-2">
          <BackButton iconOnly tooltip="Volver" variant="secondary" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${selectedCompany?.slug}/dashboard`}>
                  Inicio
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>Compras</BreadcrumbLink>
              </BreadcrumbItem>
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
          Edite costos unitarios de artículos y artículos generales.
        </p>

        <CostTypeToggle
          type={type}
          setType={setType}
          category={category}
          setCategory={setCategory}
        />

        <CostToolbar search={search} setSearch={setSearch} />

        <DataTable columns={columns} data={filteredData} />

      </div>
    </ContentLayout>
  )
}

export default CostManagementPage