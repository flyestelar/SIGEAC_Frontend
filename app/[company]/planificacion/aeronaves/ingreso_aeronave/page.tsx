"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AircraftInfoForm } from "@/components/forms/mantenimiento/aeronaves/AircraftInfoForm";
import { AircraftPartsInfoForm } from "@/components/forms/mantenimiento/aeronaves/AircraftPartsForm";
import { useCreateMaintenanceAircraft } from "@/actions/mantenimiento/planificacion/aeronaves/actions";
import { useCompanyStore } from "@/stores/CompanyStore";
import { TabsContent } from "@radix-ui/react-tabs";
import { ContentLayout } from "@/components/layout/ContentLayout";

interface AircraftPart {
    part_name: string;
    part_number: string;
    part_hours: number;
    part_cycles: number;
    condition_type: "NEW" | "OVERHAULED";
}

interface AircraftInfoType {
    manufacturer_id: string;
    client_id: string;
    serial: string;
    acronym: string;
    flight_hours: string;
    flight_cycles: string;
    fabricant_date: Date;
    location_id: string;
    comments?: string | undefined;
}

interface PartsData {
    parts: AircraftPart[];
}

export default function NewAircraftPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [aircraftData, setAircraftData] = useState<AircraftInfoType>();
    const [partsData, setPartsData] = useState<PartsData>({ parts: [] });

    const { createMaintenanceAircraft } = useCreateMaintenanceAircraft();
    const { selectedCompany } = useCompanyStore();

    const handleSubmit = async () => {
        if (aircraftData && partsData) {
            try {
                await createMaintenanceAircraft.mutateAsync({
                    data: {
                        aircraft: {
                            ...aircraftData,
                            flight_hours: Number(aircraftData.flight_hours),
                            flight_cycles: Number(aircraftData.flight_cycles),
                        },
                        parts: partsData.parts,
                    },
                    company: selectedCompany!.slug,
                });
                // redirección opcional
                // router.push("/mantenimiento/aeronaves");
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleNext = () => setCurrentStep((prev) => prev + 1);
    const handleBack = () => setCurrentStep((prev) => prev - 1);

    return (
        <ContentLayout title="Registro de Aeronave">
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Registro de Aeronave</h1>

                {/* Stepper visual con Tabs */}
                <Tabs value={String(currentStep)} className="w-full" defaultValue="1">
                    <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="1" className={currentStep === 1 ? "font-bold" : ""}>
                            1. Información
                        </TabsTrigger>
                        <TabsTrigger value="2" className={currentStep === 2 ? "font-bold" : ""}>
                            2. Partes
                        </TabsTrigger>
                        <TabsTrigger value="3" className={currentStep === 3 ? "font-bold" : ""}>
                            3. Resumen
                        </TabsTrigger>
                    </TabsList>
                    {currentStep === 1 && (
                        <TabsContent value="1"
                        >
                            <AircraftInfoForm
                                initialData={aircraftData}
                                onNext={(data) => {
                                    setAircraftData(data);
                                    handleNext();
                                }}
                            />
                        </TabsContent>
                    )}

                    {currentStep === 2 && (
                        <TabsContent value="2">
                            <AircraftPartsInfoForm
                                initialData={partsData}
                                onNext={(data) => {
                                    setPartsData(data);
                                    handleNext();
                                }}
                                onBack={handleBack}
                            />
                        </TabsContent>
                    )}

                    {currentStep === 3 && (
                        <TabsContent value="3">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Resumen</h3>

                                <div>
                                    <h4 className="font-medium mb-2">Información de la Aeronave</h4>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="font-medium">Fabricante:</span> {aircraftData?.manufacturer_id}</p>
                                        <p><span className="font-medium">Serial:</span> {aircraftData?.serial}</p>
                                        <p><span className="font-medium">Acrónimo:</span> {aircraftData?.acronym}</p>
                                        <p><span className="font-medium">Horas de Vuelo:</span> {aircraftData?.flight_hours}</p>
                                        <p><span className="font-medium">Fecha de Fabricación:</span> {aircraftData?.fabricant_date?.toLocaleDateString()}</p>
                                        <p><span className="font-medium">Ubicación:</span> {aircraftData?.location_id}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Información de las Partes</h4>
                                    <div className="space-y-2">
                                        {partsData.parts.map((part, index) => (
                                            <div key={index} className="p-3 border rounded-lg">
                                                <p className="font-medium">Parte {index + 1}</p>
                                                <div className="text-sm space-y-1">
                                                    <p><span className="font-medium">Nombre:</span> {part.part_name}</p>
                                                    <p><span className="font-medium">Número de Parte:</span> {part.part_number}</p>
                                                    <p><span className="font-medium">Horas de Vuelo:</span> {part.part_hours}</p>
                                                    <p><span className="font-medium">Ciclos de Vuelo:</span> {part.part_cycles}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center gap-x-4">
                                    <Button type="button" variant="outline" onClick={handleBack}>
                                        Anterior
                                    </Button>
                                    <Button
                                        disabled={createMaintenanceAircraft.isPending}
                                        type="button"
                                        onClick={handleSubmit}
                                    >
                                        Confirmar y Enviar
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </ContentLayout>
    );
}
