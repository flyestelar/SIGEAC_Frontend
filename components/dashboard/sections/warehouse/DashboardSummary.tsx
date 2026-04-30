'use client'

import { BarChart3 } from 'lucide-react'
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface DashboardSummaryProps {
  companySlug: string
}

/* =========================
   CARD TINTADO (BLUE)
   ========================= */
function TintedCard({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: string
}) {
  return (
    <Card
      className="relative overflow-hidden rounded-3xl border bg-background/70 backdrop-blur-xl shadow-sm"
      style={{
        borderColor: `rgba(${tone}, 0.22)`,
        backgroundImage: `linear-gradient(to bottom right, rgba(${tone}, 0.06), transparent 60%)`,
      }}
    >
      {children}
    </Card>
  )
}

export default function DashboardSummary({ companySlug }: DashboardSummaryProps) {
  const router = useRouter()

  const blueTone = "37,99,235"

  return (
    <div className='mt-16'>
      {/* Mensaje de bienvenida */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Bienvenido a <span className="text-blue-600 block italic">SIGEAC</span>
        </h1>
        <p className="text-lg max-w-3xl mx-auto leading-relaxed text-slate-600 dark:text-slate-300">
          Plataforma integral enfocada en la gestión operativa del inventario aeronáutico y el control estructurado de recursos críticos dentro del sistema.
        </p>
      </div>

      {/* CTA */}
      <div className="flex justify-center mb-16">
        <TintedCard tone={blueTone}>
          <CardHeader className="pb-4 text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>

            <CardTitle className="text-xl">Consulta de Inventario</CardTitle>

            <CardDescription className="text-base pt-2">
              Acceda al sistema completo de gestión de inventario aeronáutico
            </CardDescription>
          </CardHeader>

          <CardContent className="flex justify-center pb-8">
            <Button
              onClick={() => router.push(`/${companySlug}/almacen/inventario_articulos`)}
              className="relative overflow-hidden px-6 min-w-[220px] bg-blue-600/90 hover:bg-blue-600 text-white font-medium tracking-wide shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-[2px] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2"
            >
              Ver Inventario Completo
            </Button>
          </CardContent>
        </TintedCard>
      </div>
    </div>
  )
}