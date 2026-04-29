"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { useGetWarehouseDashboard } from "@/hooks/sistema/dashboard/useWarehouseDashboard";
import { User } from "@/types";

import {
  LayoutDashboard,
  Package2,
  Wrench,
  Users,
  Boxes,
  ShieldCheck,
} from "lucide-react";

// Subcomponentes
import ArticlesSummary from "@/components/dashboard/sections/warehouse/ArticlesSummary";
import ToolsSummary from "@/components/dashboard/sections/warehouse/ToolsSummary";
import UsersSummary from "@/components/dashboard/sections/warehouse/UsersSummary";
import DashboardSummary from "@/components/dashboard/sections/warehouse/DashboardSummary";

interface WarehouseDashboardContentProps {
  companySlug: string;
  location_id: string;
  user: User;
  roleNames: string[];
}

export default function WarehouseDashboardContent({
  companySlug,
  location_id,
  roleNames,
}: WarehouseDashboardContentProps) {
  const [activeTab, setActiveTab] = useState("DASHBOARD");

  const { data, isLoading, isError } = useGetWarehouseDashboard(
    companySlug,
    location_id
  );

  const canViewUsersTab = roleNames.some((r) =>
    ["SUPERUSER", "JEFE_ALMACEN"].includes(r)
  );

  return (
    <main className="max-w-7xl mt-6 mx-auto px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>

        {/* ===================== TABS BASE ===================== */}
        <TabsList className="w-full flex justify-center mb-6 p-2 rounded-2xl bg-slate-200/50 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/40 dark:border-slate-800/60">

          <div className="flex w-full max-w-md gap-2">

            {/* DASHBOARD — azul principal */}
            <TabsTrigger
              value="DASHBOARD"
              className="flex-1 flex items-center justify-center gap-2 text-xs h-7 px-3 rounded-xl transition-all duration-200
              text-slate-500 dark:text-slate-400
              hover:text-blue-600 dark:hover:text-blue-400
              data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-900/50
              data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400
              data-[state=active]:shadow-[0_0_18px_rgba(37,99,235,0.25)]
              data-[state=active]:ring-1 data-[state=active]:ring-blue-300/50"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              Dashboard
            </TabsTrigger>

            {/* ARTÍCULOS — emerald (inventario / stock) */}
            <TabsTrigger
              value="ARTICULOS"
              className="flex-1 flex items-center justify-center gap-2 text-xs h-7 px-3 rounded-xl transition-all duration-200
              text-slate-500 dark:text-slate-400
              hover:text-emerald-600 dark:hover:text-emerald-400
              data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-900/50
              data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400
              data-[state=active]:shadow-[0_0_18px_rgba(16,185,129,0.25)]
              data-[state=active]:ring-1 data-[state=active]:ring-emerald-300/50"
            >
              <Boxes className="w-3.5 h-3.5 shrink-0" />
              Artículos
            </TabsTrigger>

            {/* HERRAMIENTAS — amber (uso operativo / mantenimiento) */}
            <TabsTrigger
              value="HERRAMIENTAS"
              className="flex-1 flex items-center justify-center gap-2 text-xs h-7 px-3 rounded-xl transition-all duration-200
              text-slate-500 dark:text-slate-400
              hover:text-amber-600 dark:hover:text-amber-400
              data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-900/50
              data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400
              data-[state=active]:shadow-[0_0_18px_rgba(245,158,11,0.25)]
              data-[state=active]:ring-1 data-[state=active]:ring-amber-300/50"
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              Herramientas
            </TabsTrigger>

            {/* USUARIOS — violet (control / administración) */}
            {canViewUsersTab && (
              <TabsTrigger
                value="USUARIOS"
                className="flex-1 flex items-center justify-center gap-2 text-xs h-7 px-3 rounded-xl transition-all duration-200
                text-slate-500 dark:text-slate-400
                hover:text-violet-600 dark:hover:text-violet-400
                data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-900/50
                data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400
                data-[state=active]:shadow-[0_0_18px_rgba(139,92,246,0.25)]
                data-[state=active]:ring-1 data-[state=active]:ring-violet-300/50"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                Usuarios
              </TabsTrigger>
            )}

          </div>

        </TabsList>

        {/* ===================== CONTENT ===================== */}
        <div className="mt-8">

          <TabsContent value="DASHBOARD">
            <DashboardSummary companySlug={companySlug} />
          </TabsContent>

          <TabsContent value="ARTICULOS">
            <ArticlesSummary
              data={data}
              isLoading={isLoading}
              isError={isError}
            />
          </TabsContent>

          <TabsContent value="HERRAMIENTAS">
            <ToolsSummary
              data={data}
              isLoading={isLoading}
              isError={isError}
            />
          </TabsContent>

          {canViewUsersTab && (
            <TabsContent value="USUARIOS">
              <UsersSummary
                data={data}
                isLoading={isLoading}
                isError={isError}
                currentUserRole={roleNames[0]}
              />
            </TabsContent>
          )}

        </div>

      </Tabs>
    </main>
  );
}