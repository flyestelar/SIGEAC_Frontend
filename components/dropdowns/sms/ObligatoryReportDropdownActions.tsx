import { useDeleteObligatoryReport } from "@/actions/sms/reporte_obligatorio/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetDangerIdentificationWithAllById } from "@/hooks/sms/useGetDangerIdentificationWithAllById";
import { ObligatoryReportResource } from "@/.gen/api/types.gen";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { format } from "date-fns";
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
import CreateDangerIdentificationForm from "@/components/forms/sms/CreateIdentificationForm";
import { CreateObligatoryReportForm } from "@/components/forms/sms/CreateObligatoryReportForm";
import ObligatoryReportPdf from "@/components/pdf/sms/ObligatoryReportPdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCompanyStore } from "@/stores/CompanyStore";
import { Button } from "@/components/ui/button";
import { AcceptObligatoryReport } from "@/components/forms/sms/AcceptObligatoryForm";

const ObligatoryReportDropdownActions = ({
  obligatoryReport,
}: {
  obligatoryReport: ObligatoryReportResource;
}) => {
  const { selectedCompany } = useCompanyStore();
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [openCreateDangerIdentification, setOpenCreateDangerIdentification] =useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openAccept, setOpenAccept] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [openPrint, setOpenPrint] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const pdfUrlRef = useRef<string | null>(null);
  const [openPDF, setOpenPDF] = useState<boolean>(false);
  

  const router = useRouter();

  const { deleteObligatoryReport } = useDeleteObligatoryReport();

  const { data: dangerIdentification } = useGetDangerIdentificationWithAllById({
    company: selectedCompany?.slug,
    id: obligatoryReport?.danger_identification?.id?.toString() ?? "",
  });

  useEffect(() => {
      if (!openPDF) return;
      setIsLoadingPdf(true);
      axiosInstance
        .get(`/${selectedCompany?.slug}/sms/obligatory-reports/${obligatoryReport.id}/pdf`, {
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
    await deleteObligatoryReport.mutateAsync(value);
    setOpenDelete(false);
  };
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="center"
            className="flex-col gap-2 justify-center"
          >
            {/*Este es el primer icon ode edit */}

            {obligatoryReport.status === "ABIERTO" && (
              <DropdownMenuItem onClick={() => setOpenEdit(true)}>
                <ClipboardPen className="size-5" />
                <p className="pl-2"> Editar </p>
              </DropdownMenuItem>
            )}

            {obligatoryReport.status === "ABIERTO" && (
              <DropdownMenuItem onClick={() => setOpenAccept(true)}>
                <CheckCheck className="size-5 text-green-400" />
                <p className="pl-2 "> Aceptar </p>
              </DropdownMenuItem>
            )}

            {(obligatoryReport.status === "ABIERTO") && (
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
                  `/${selectedCompany?.slug}/sms/reportes/reportes_obligatorios/${obligatoryReport.id}`
                );
              }}
            >
              <EyeIcon className="size-5" />
              <p className="pl-2"> Ver </p>
            </DropdownMenuItem>
            {obligatoryReport?.danger_identification?.id === null &&
              obligatoryReport?.status === "ABIERTO" && (
                <DropdownMenuItem
                  onClick={() => setOpenCreateDangerIdentification(true)}
                >
                  <ClipboardPenLine className="size-5" />
                  <p className="pl-2"> Crear Identificacion </p>
                </DropdownMenuItem>
              )}

            {obligatoryReport && (
              <DropdownMenuItem onClick={() => setOpenPDF(true)}>
                <PrinterCheck className="size-5" />
                <p className="pl-2"> Descargar PDF</p>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">
                ¿Seguro que desea eliminar el reporte?
              </DialogTitle>
              <DialogDescription className="text-center p-2 mb-0 pb-0">
                Esta acción es irreversible y estaría eliminando por completo el
                reporte seleccionado.
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
                disabled={deleteObligatoryReport.isPending}
                className="hover:bg-white hover:text-black hover:border hover:border-black transition-all"
                onClick={() => {
                  if (obligatoryReport.id) {
                    handleDelete(obligatoryReport.id);
                  }
                }}
              >
                {deleteObligatoryReport.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Confirmar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent className="flex flex-col max-w-3xl max-h-[calc(100vh-6rem)] m-2 overflow-auto">
            <DialogHeader />
            <CreateObligatoryReportForm
              initialData={obligatoryReport}
              isEditing={true}
              onClose={() => setOpenEdit(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={openAccept} onOpenChange={setOpenAccept}>
          <DialogContent className="flex flex-col max-w-2xl m-2">
            <DialogHeader>
              <DialogTitle className="text-center"></DialogTitle>
              <AcceptObligatoryReport
                initialData={obligatoryReport}
                onClose={() => setOpenAccept(false)}
              ></AcceptObligatoryReport>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Dialog
          open={openCreateDangerIdentification}
          onOpenChange={setOpenCreateDangerIdentification}
        >
          <DialogContent className="flex flex-col max-w-2xl m-2">
            <DialogHeader>
              <DialogTitle></DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>

            {obligatoryReport.id && (
              <CreateDangerIdentificationForm
                id={obligatoryReport.id}
                reportType="ROS"
              />
            )}
          </DialogContent>
        </Dialog>

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
                <Button asChild>
                  <a
                    href={pdfUrl}
                    download={`ROS-${obligatoryReport.report_number || obligatoryReport.id}.pdf`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Reporte
                  </a>
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* <Dialog open={openPrint} onOpenChange={setOpenPrint}>
          <DialogContent className="sm:max-w-[65%] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Vista Previa del Reporte</DialogTitle>
              <DialogDescription>
                Revisa el reporte antes de descargarlo.
              </DialogDescription>
            </DialogHeader>
            <div className="w-full h-screen">
              {obligatoryReport && dangerIdentification ? (
                <PDFViewer style={{ width: "100%", height: "60%" }}>
                  <ObligatoryReportPdf
                    report={obligatoryReport}
                    identification={dangerIdentification}
                  />
                </PDFViewer>
              ) : (
                <>
                  <PDFViewer style={{ width: "100%", height: "60%" }}>
                    <ObligatoryReportPdf report={obligatoryReport} />
                  </PDFViewer>
                </>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <PDFDownloadLink
                fileName={`reporte_diario_${format(
                  new Date(),
                  "dd-MM-yyyy"
                )}.pdf`}
                document={<ObligatoryReportPdf report={obligatoryReport} />}
              >
                <Button>Descargar Reporte</Button>
              </PDFDownloadLink>
            </div>
          </DialogContent>
        </Dialog> */}
      </Dialog>
    </>
  );
};

export default ObligatoryReportDropdownActions;
