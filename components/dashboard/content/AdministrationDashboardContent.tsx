"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileBarChart2 } from "lucide-react";
import { useState } from "react";
import { User } from "@/types";
import { useGetWarehouseDashboard } from "@/hooks/sistema/dashboard/useWarehouseDashboard";

import DispatchWarehouseReports from "@/components/dashboard/sections/Administration/DispatchWarehouseReports";
import DispatchSummary from "../sections/Administration/DispatchSummary";

interface AdministrationDashboardContentProps {
  companySlug: string;
  location_id: string;
  user: User;
  roleNames: string[];
}

export default function AdministrationDashboardContent({
  companySlug,
  location_id,
  user,
  roleNames,
}: AdministrationDashboardContentProps) {
  const [activeTab, setActiveTab] = useState("REPORTES");

  const { data, isLoading, isError } = useGetWarehouseDashboard(
    companySlug,
    location_id
  );

  return (
    <main className="max-w-7xl mt-6 mx-auto px-4">

      <Tabs value={activeTab} onValueChange={setActiveTab}>

        {/* ===================== TABS (MISMO SISTEMA EXACTO) ===================== */}
        <TabsList className="w-full flex justify-center mb-6 p-2 rounded-2xl bg-slate-200/50 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/40 dark:border-slate-800/60">

          <div className="flex w-full max-w-md gap-2">

            <TabsTrigger
              value="REPORTES"
              className="flex-1 flex items-center justify-center gap-2 text-xs h-7 px-3 rounded-xl transition-all duration-200 whitespace-nowrap text-slate-500 dark:text-slate-400 hover:text-violet-500 dark:hover:text-violet-300 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-900/50 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-[0_0_18px_rgba(167,139,250,0.25)] data-[state=active]:ring-1 data-[state=active]:ring-violet-300/50"
            >
              <FileBarChart2 className="w-3.5 h-3.5 shrink-0" />
              Reportes
            </TabsTrigger>

            <TabsTrigger
              value="RESUMEN DE SOLICITUDES"
              className="flex-1 flex items-center justify-center gap-2 text-xs h-7 px-3 rounded-xl transition-all duration-200 whitespace-nowrap text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-300 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-900/50 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-300 data-[state=active]:shadow-[0_0_18px_rgba(45,212,191,0.25)] data-[state=active]:ring-1 data-[state=active]:ring-teal-300/50"
            >
              <FileBarChart2 className="w-3.5 h-3.5 shrink-0" />
              Resumen
            </TabsTrigger>

          </div>

        </TabsList>

        {/* ===================== CONTENT ===================== */}
        <div className="mt-8">

          <TabsContent value="REPORTES">
            <DispatchWarehouseReports
              companySlug={companySlug}
              location_id={location_id}
              user={user}
              roleNames={roleNames}
            />
          </TabsContent>

          <TabsContent value="RESUMEN DE SOLICITUDES">
            <DispatchSummary
              data={data}
              isLoading={isLoading}
              isError={isError}
            />
          </TabsContent>

        </div>

      </Tabs>

    </main>
  );
}