"use client"

import { ContentLayout } from '@/components/layout/ContentLayout'
import LoadingPage from '@/components/misc/LoadingPage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts'
import { useCompanyStore } from '@/stores/CompanyStore'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { PlanificationAircraftTab } from './_components/PlanificationAircraftTab'

const AircraftsPage = () => {
  const { selectedCompany } = useCompanyStore();
  const { data: aircrafts, isLoading, isError } = useGetMaintenanceAircrafts(selectedCompany?.slug)

  if (isLoading) {
    return <LoadingPage />
  }

  return (
    <ContentLayout title='Aeronaves'>
      <div className='flex flex-col text-center justify-center gap-2'>
        <h1 className='font-bold text-5xl'>Gestión de Aeronaves</h1>
        <p className='text-muted-foreground italic text-sm'>Aquí puede llevar un registro de todas las aeronaves registradas en el sistema. <br />Puede crear o editar las aeronaves de ser necesarios.</p>
      </div>
      {
        aircrafts && (
          <Tabs defaultValue={aircrafts[0].acronym}>
            <TabsList className='flex justify-center w-full'>
              {
                aircrafts.map((aircraft) => (
                  <TabsTrigger key={aircraft.id} value={aircraft.acronym}>{aircraft.acronym}</TabsTrigger>
                ))
              }
              <Link
                href={`/${selectedCompany?.slug}/planificacion/aeronaves/ingreso_aeronave`}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-1"
              >
        <PlusCircle className="size-4" /> Registrar
      </Link>
            </TabsList>
            {
              aircrafts.map((aircraft) => (
                <TabsContent key={aircraft.id} value={aircraft.acronym}>
                  <PlanificationAircraftTab aircraft={aircraft} />
                </TabsContent>
              ))
            }
          </Tabs>
        )
      }
      {
        isError && <p className='text-muted-foreground italic text-center'>Ha ocurrido un error al cargar los datos...</p>
      }
    </ContentLayout>
  )
}

export default AircraftsPage
