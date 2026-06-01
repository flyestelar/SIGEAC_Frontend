"use client";

import { ContentLayout } from "@/components/layout/ContentLayout";
import QRGenerator from "@/components/misc/QRGenerator";
import { useCompanyStore } from "@/stores/CompanyStore";
import { Wifi } from "lucide-react";
import { useRef } from "react";

const QrCodePage = () => {
    const { selectedCompany } = useCompanyStore();
    const qrWrapperRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        const canvas = qrWrapperRef.current?.querySelector("canvas");
        if (!canvas) return;
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `pagina-sms-${selectedCompany?.slug}.png`;
        link.click();
    };

    const qrValueReport = `${process.env.NEXT_PUBLIC_URL}${selectedCompany?.slug}/sms/crear_reporte`;
    const qrSMSPage = `${process.env.NEXT_PUBLIC_URL}acceso_publico/${selectedCompany?.slug}/sms`;

    return (
        <ContentLayout title="Códigos QR">
            {/* Fondo con patrón de puntos */}
            <div
                className="min-h-[80vh] w-full flex flex-col items-center justify-center py-16 px-4"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
            >
                {/* Encabezado de sección */}
                <div className="mb-12 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">
                        Sistema de Gestión de Seguridad
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        Códigos QR
                    </h1>
                    <div className="mt-3 mx-auto h-px w-16 bg-slate-300 dark:bg-slate-600" />
                </div>

                {/* Card tipo pase técnico */}
                <div
                    className="w-full max-w-sm overflow-hidden"
                    style={{
                        boxShadow: "0 2px 0 #1e293b, 0 4px 24px rgba(0,0,0,0.18)",
                        borderRadius: "12px",
                    }}
                >
                    {/* Banda superior */}
                    <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-semibold">
                                Acceso Público
                            </p>
                            <p className="text-white font-bold text-sm mt-0.5 tracking-wide">
                                Página de SMS
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-700/60 rounded-full px-3 py-1.5">
                            <Wifi className="h-3 w-3 text-amber-400" />
                            <span className="text-[9px] text-amber-400 font-mono font-semibold tracking-wider uppercase">
                                Escanear
                            </span>
                        </div>
                    </div>

                    {/* Línea de perforación */}
                    <div className="relative h-px bg-slate-200 dark:bg-slate-700">
                        <div
                            className="absolute -left-3 -top-2.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)" }}
                        />
                        <div
                            className="absolute -right-3 -top-2.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)" }}
                        />
                        <div className="absolute inset-0 border-t border-dashed border-slate-300 dark:border-slate-600" />
                    </div>

                    {/* Cuerpo del pase */}
                    <div className="bg-white dark:bg-slate-900 px-8 py-8 flex flex-col items-center gap-6">
                        {/* Marcas de esquina alrededor del QR */}
                        <div ref={qrWrapperRef} className="relative p-4">
                            {/* Esquinas decorativas */}
                            <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-slate-800 dark:border-slate-300 rounded-tl" />
                            <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-slate-800 dark:border-slate-300 rounded-tr" />
                            <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-slate-800 dark:border-slate-300 rounded-bl" />
                            <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-slate-800 dark:border-slate-300 rounded-br" />
                            <QRGenerator
                                value={qrSMSPage}
                                fileName={`pagina-sms-${selectedCompany?.slug}`}
                                bgColor="#ffffff"
                                fgColor="#0f172a"
                                showLink={false}
                                showDownloadButton={false}
                                size={240}
                            />
                        </div>

                        {/* URL en monospace */}
                        <div className="w-full bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 px-3 py-2">
                            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1">
                                Destino
                            </p>
                            <a
                                href={qrSMSPage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[11px] text-blue-600 dark:text-blue-400 break-all leading-relaxed hover:underline"
                            >
                                {qrSMSPage}
                            </a>
                        </div>

                        {/* Info compañía */}
                        <div className="w-full flex items-center justify-between">
                            <div>
                                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                                    Operador
                                </p>
                                <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mt-0.5">
                                    {selectedCompany?.slug ?? "—"}
                                </p>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="text-[10px] font-semibold uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors px-4 py-2 rounded"
                            >
                                Descargar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Nota al pie */}
                <p className="mt-8 text-[10px] text-slate-400 tracking-widest uppercase font-medium">
                    SIGEAC · Sistema de Gestión de Seguridad
                </p>
            </div>
        </ContentLayout>
    );
};

export default QrCodePage;
