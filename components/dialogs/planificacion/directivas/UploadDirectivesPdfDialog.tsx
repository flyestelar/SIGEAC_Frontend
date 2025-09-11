import UploadDirectivePdfsForm from '@/components/forms/mantenimiento/planificacion/directivas/UploadDirectivesPdfsForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { useState } from 'react';

const UploadDirectivePdfsDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>Subir PDFs</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Subir AD(s) en PDF</DialogTitle>
          <DialogDescription>Suba los archivos PDF de las AD(s) que desea cargar en el sistema.</DialogDescription>
        </DialogHeader>
        <UploadDirectivePdfsForm />
      </DialogContent>
    </Dialog>
  );
};

export default UploadDirectivePdfsDialog;
