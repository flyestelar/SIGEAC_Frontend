'use client';

import CreateAirworthinessDirectiveForm from '@/components/forms/mantenimiento/planificacion/directivas/CreateAirworthinessDirectiveForm';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCompanyStore } from '@/stores/CompanyStore';
import { ArrowLeft, FileBadge2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateAirworthinessDirectivePage() {
  const { selectedCompany } = useCompanyStore();
  const router = useRouter();
  const basePath = `/${selectedCompany?.slug}/planificacion/directivas`;

  const handleSuccess = (directiveId: number) => {
    router.push(`${basePath}/${directiveId}`);
  };

  return (
    <ContentLayout title="Nueva directiva">
      <div className="space-y-4 py-4">
        <div className="space-y-3">
          <Link href={basePath} className="inline-flex">
            <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Volver al índice
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-muted-foreground">
            <FileBadge2 className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.22em]">Nueva directiva</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Registrar directiva de aeronavegabilidad</h1>
            <p className="text-sm text-muted-foreground">
              Completa los datos base y opcionalmente configura los controles de cumplimiento iniciales.
            </p>
          </div>
        </div>

        <Card className="rounded-lg border bg-background">
          <CardContent className="p-5">
            <CreateAirworthinessDirectiveForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
