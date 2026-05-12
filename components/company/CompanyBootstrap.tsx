"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plane } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useGetUserLocationsByCompanyId } from "@/hooks/sistema/usuario/useGetUserLocationsByCompanyId";
import { useCompanyStore } from "@/stores/CompanyStore";

import CompanySelect from "@/components/selects/CompanySelect";

const CompanyBootstrap = () => {
  const router = useRouter();
  const navigatingRef = useRef(false);

  const { user, loading: userLoading } = useAuth();

  const {
    selectedCompany,
    selectedStation,
    setSelectedCompany,
    setSelectedStation,
    reset,
  } = useCompanyStore();

  const {
    mutateAsync: getLocations,
    isPending: locationsLoading,
  } = useGetUserLocationsByCompanyId();

  const [hydrated, setHydrated] = useState(false);

  /**
   * HYDRATION SEGURA
   */
  useEffect(() => {
    const unsub =
      useCompanyStore.persist.onFinishHydration(() =>
        setHydrated(true)
      );

    if (useCompanyStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => unsub();
  }, []);

  /**
   * HISTORIAL
   */
  const getHistory = () => {
    if (typeof window === "undefined") return {};

    try {
      return JSON.parse(
        localStorage.getItem("company-station-history") ||
          "{}"
      );
    } catch {
      return {};
    }
  };

  const saveHistory = (
    companyId: number | string,
    stationId: string
  ) => {
    if (typeof window === "undefined") return;

    const history = getHistory();

    history[String(companyId)] = stationId;

    localStorage.setItem(
      "company-station-history",
      JSON.stringify(history)
    );
  };

  /**
   * RESOLVER ESTACIÓN (solo sugerencia)
   */
  const resolveStation = (
    companyId: number | string,
    stations: any[]
  ) => {
    const history = getHistory();

    const last = history[String(companyId)];

    const validLast = stations.find(
      (s) => s.id.toString() === last
    );

    return validLast
      ? validLast.id.toString()
      : stations[0].id.toString();
  };

  /**
   * BOOTSTRAP
   */
  useEffect(() => {
    const bootstrap = async () => {
      if (
        !hydrated ||
        userLoading ||
        !user ||
        navigatingRef.current
      ) {
        return;
      }

      /**
       * CASO 1: sesión restaurada válida
       */
      if (selectedCompany && selectedStation) {
        const companyExists =
          user.companies?.some(
            (c) => c.id === selectedCompany.id
          );

        if (!companyExists) {
          reset();
          return;
        }

        try {
          const locations =
            await getLocations(selectedCompany.id);

          if (!locations?.length) {
            reset();
            return;
          }

          const stationExists = locations.some(
            (l) =>
              l.id.toString() === selectedStation
          );

          if (!stationExists) {
            reset();
            return;
          }

          navigatingRef.current = true;

          router.replace(
            `/${selectedCompany.slug}/dashboard`
          );

          return;
        } catch {
          reset();
          return;
        }
      }

      /**
       * CASO 2: NO hay company seleccionada → NO forzar ninguna
       * 👉 este es el FIX CLAVE que faltaba
       */
      if (!selectedCompany) {
        return;
      }

      const company = selectedCompany;

      const companyExists =
        user.companies?.some(
          (c) => c.id === company.id
        );

      if (!companyExists) {
        reset();
        return;
      }

      try {
        const locations =
          await getLocations(company.id);

        if (!locations?.length) return;

        /**
         * CASO A: SOLO 1 estación → auto-select obligatorio
         */
        if (locations.length === 1) {
          const station =
            locations[0].id.toString();

          setSelectedStation(station);

          saveHistory(company.id, station);

          navigatingRef.current = true;

          router.replace(
            `/${company.slug}/dashboard`
          );

          return;
        }

        /**
         * CASO B: MÚLTIPLES estaciones → NO auto-select
         * 👉 solo sugerimos última, pero NO forzamos navegación
         */
        const suggestedStation = resolveStation(
          company.id,
          locations
        );

        const history = getHistory();

        const last = history[String(company.id)];

        /**
         * SOLO precargar si coincide con historial,
         * pero NO navegar ni forzar selección si hay múltiples
         */
        if (last && last === suggestedStation) {
          setSelectedStation(suggestedStation);
        } else {
          setSelectedStation("");
        }

        saveHistory(company.id, suggestedStation);

        /**
         * IMPORTANTE:
         * NO router.replace aquí
         * el usuario debe elegir estación
         */
      } catch (error) {
        console.error(error);
      }
    };

    bootstrap();
  }, [
    hydrated,
    user,
    userLoading,
    selectedCompany,
    selectedStation,
    getLocations,
    setSelectedCompany,
    setSelectedStation,
    reset,
    router,
  ]);

  /**
   * LOADING
   */
  if (
    !hydrated ||
    userLoading ||
    locationsLoading ||
    navigatingRef.current
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background">
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative">
            <Plane className="w-10 h-10 text-primary animate-bounce" />
            <div className="absolute inset-0 blur-xl opacity-30 bg-primary rounded-full scale-150" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">
              Preparando tu entorno
            </p>
            <p className="text-sm text-muted-foreground">
              Cargando configuración del sistema...
            </p>
          </div>

          <div className="w-40 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-primary animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return <CompanySelect />;
};

export default CompanyBootstrap;