'use client';

import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { FileUploadField } from './FileUploadField';

interface CertificatesSectionProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  imageName: Path<T>;
  cert8130Name: Path<T>;
  certFabricantName: Path<T>;
  certVendorName: Path<T>;
}

export function CertificatesSection<T extends FieldValues>({
  form,
  imageName,
  cert8130Name,
  certFabricantName,
  certVendorName,
}: CertificatesSectionProps<T>) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Detalles y documentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUploadField form={form} name={imageName} label="Imagen del artículo" description="Imagen descriptiva." accept="image/*" />
          <div className="space-y-4">
            <FileUploadField
              form={form}
              name={cert8130Name}
              label={
                <>
                  Certificado <span className="text-primary font-semibold">8130</span>
                </>
              }
              description="PDF o imagen. Máx. 10 MB."
            />
            <FileUploadField
              form={form}
              name={certFabricantName}
              label={
                <>
                  Certificado del <span className="text-primary">fabricante</span>
                </>
              }
              description="PDF o imagen. Máx. 10 MB."
            />
            <FileUploadField
              form={form}
              name={certVendorName}
              label={
                <>
                  Certificado del <span className="text-primary">vendedor</span>
                </>
              }
              description="PDF o imagen. Máx. 10 MB."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
