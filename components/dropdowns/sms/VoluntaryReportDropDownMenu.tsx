import { useDeleteVoluntaryReport } from "@/actions/sms/reporte_voluntario/actions";
import { AcceptVoluntaryReport } from "@/components/forms/sms/AcceptVoluntaryForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompanyStore } from "@/stores/CompanyStore";
import { VoluntaryReportResource } from "@/.gen/api/types.gen";
import axiosInstance from "@/lib/axios";
import {
  CheckCheck,
  ClipboardPen,
  ClipboardPenLine,
  Download,
  EyeIcon,
  Loader2,
  MoreHorizontal,
  PrinterCheck,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CreateVoluntaryReportForm } from "@/components/forms/sms/CreateVoluntaryReportForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const VoluntaryReportDropdownActions = ({
  voluntaryReport,
}: {
  voluntaryReport: VoluntaryReportResource;
}) => {
  const { selectedCompany } = useCompanyStore();

  const [open, setOpen] = useState<boolean>(false);
  const [openPDF, setOpenPDF] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openAccept, setOpenAccept] = useState<boolean>(false);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const pdfUrlRef = useRef<string | null>(null);
  const { deleteVoluntaryReport } = useDeleteVoluntaryReport();
  const router = useRouter();

  useEffect(() => {
    if (!openPDF) return;
    setIsLoadingPdf(true);
    axiosInstance
      .get(`/${selectedCompany?.slug}/sms/voluntary-reports/${voluntaryReport.id}/pdf`, {
        responseType: "blob",
      })
      .then((response) => {
        const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        pdfUrlRef.current = url;
        setPdfUrl(url);
      })
      .catch((error) => console.error("Error al cargar el PDF:", error))
      .finally(() => setIsLoadingPdf(false));

    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, [openPDF]);

  const handleDelete = async (id: number | string) => {
    const value = {
      company: selectedCompany!.slug,
      id: id.toString(),
    };
    await deleteVoluntaryReport.mutateAsync(value);
    setOpenDelete(false);
  };

  // ✅ Nueva función para redirigir enviando el ID del reporte
  const handleCreateIdentification = () => {
    router.push(
      `/${selectedCompany?.slug}/sms/gestion_reportes/peligros_identificados/crear_identificacion?reporteId=${voluntaryReport.id}`
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="center"
            className="flex-col gap-2 justify-center"
          >
            {voluntaryReport && voluntaryReport.status === "ABIERTO" && (
              <DropdownMenuItem onClick={() => setOpenEdit(true)}>
                <ClipboardPen className="size-5" />
                <p className="pl-2">Editar</p>
              </DropdownMenuItem>
            )}

            {voluntaryReport && voluntaryReport.status === "PROCESO" && (
              <DropdownMenuItem onClick={() => setOpenAccept(true)}>
                <CheckCheck className="size-5 text-green-400" />
                <p className="pl-2">Aceptar</p>
              </DropdownMenuItem>
            )}

            {voluntaryReport &&
              (voluntaryReport.status === "ABIERTO" ||
                voluntaryReport.status === "PROCESO") && (
                <DialogTrigger asChild>
                  <DropdownMenuItem onClick={() => setOpenDelete(true)}>
                    <Trash2 className="size-5 text-red-500" />
                    <p className="pl-2">Eliminar</p>
                  </DropdownMenuItem>
                </DialogTrigger>
              )}

            <DropdownMenuItem
              onClick={() => {
                router.push(
                  `/transmandu/sms/reportes/reportes_voluntarios/${voluntaryReport.id}`
                );
              }}
            >
              <EyeIcon className="size-5" />
              <p className="pl-2">Ver</p>
            </DropdownMenuItem>

            {/* ✅ Modificación: redirige enviando el ID como query param */}
            {!voluntaryReport.danger_identification_id &&
              voluntaryReport.status === "ABIERTO" && (
                <DropdownMenuItem onClick={handleCreateIdentification}>
                  <ClipboardPenLine className="size-5" />
                  <p className="pl-2">Crear Identificación</p>
                </DropdownMenuItem>
              )}

            {voluntaryReport && voluntaryReport.status !== "PROCESO" && (
              <DropdownMenuItem onClick={() => setOpenPDF(true)}>
                <PrinterCheck className="size-5" />
                <p className="pl-2">Descargar PDF</p>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* PDF Viewer */}
        <Dialog open={openPDF} onOpenChange={(val) => { setOpenPDF(val); if (!val) setPdfUrl(null); }}>
          <DialogContent className="sm:max-w-[65%] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Vista Previa del Reporte</DialogTitle>
              <DialogDescription>
                Revisa el reporte antes de descargarlo.
              </DialogDescription>
            </DialogHeader>
            <div className="w-full h-[60vh] flex items-center justify-center">
              {isLoadingPdf ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full rounded border"
                  title="Vista previa del reporte voluntario"
                />
              ) : (
                <p className="text-sm text-muted-foreground">No se pudo cargar el PDF.</p>
              )}
            </div>
            <div className="flex justify-end mt-4">
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  download={`RVP-${voluntaryReport.report_number || voluntaryReport.id}.pdf`}
                >
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Reporte
                  </Button>
                </a>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete dialog */}
        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">
                ¿Seguro que desea eliminar el reporte?
              </DialogTitle>
              <DialogDescription className="text-center p-2 mb-0 pb-0">
                Esta acción es irreversible y eliminará por completo el reporte.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col-reverse gap-2 md:gap-0">
              <Button
                className="bg-rose-400 hover:bg-white hover:text-black hover:border hover:border-black"
                onClick={() => setOpenDelete(false)}
                type="submit"
              >
                Cancelar
              </Button>
              <Button
                disabled={deleteVoluntaryReport.isPending}
                className="hover:bg-white hover:text-black hover:border hover:border-black transition-all"
                onClick={() => handleDelete(voluntaryReport.id)}
              >
                {deleteVoluntaryReport.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <p>Confirmar</p>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent className="flex flex-col max-w-3xl max-h-[calc(100vh-10rem)] m-2 overflow-auto">
            <DialogHeader />
            <CreateVoluntaryReportForm
              onClose={() => setOpenEdit(false)}
              initialData={voluntaryReport}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>

        {/* Accept dialog */}
        <Dialog open={openAccept} onOpenChange={setOpenAccept}>
          <DialogContent className="flex flex-col w-2xs m-2">
            <DialogHeader />
            <AcceptVoluntaryReport
              onClose={() => setOpenAccept(false)}
              initialData={voluntaryReport}
            />
          </DialogContent>
        </Dialog>
      </Dialog>
    </>
  );
};

export default VoluntaryReportDropdownActions;
