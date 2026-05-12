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
  const mountedRef = useRef(true);
  const [hydrated, setHydrated] =
    useState(false);
  const { user, loading: userLoading } =
    useAuth();
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

  useEffect(() => {
    mountedRef.current = true;

    const finishHydration =
      useCompanyStore.persist
        .onFinishHydration(() => {
          if (mountedRef.current) {
            setHydrated(true);
          }
        });
    if (
      useCompanyStore.persist.hasHydrated()
    ) {
      setHydrated(true);
    }

    return () => {
      mountedRef.current = false;
      finishHydration();
    };
  }, []);

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
      if (
        selectedCompany &&
        selectedStation
      ) {
        const companyStillExists =
          user.companies?.some(
            (company) =>
              company.id ===
              selectedCompany.id
          );

        if (!companyStillExists) {
          reset();
          return;
        }
        try {
          const locations =
            await getLocations(
              selectedCompany.id
            );
          if (
            !Array.isArray(locations) ||
            locations.length === 0
          ) {
            reset();
            return;
          }
          const stationStillExists =
            locations.some(
              (location) =>
                location.id.toString() ===
                selectedStation
            );

          if (!stationStillExists) {
            reset();
            return;
          }
          navigatingRef.current = true;
          router.replace(
            `/${selectedCompany.slug}/dashboard`
          );
          return;
        } catch (error) {
          console.error(
            "Bootstrap validation error:",
            error
          );
          reset();
          return;
        }
      }

      if (
        user.companies?.length === 1
      ) {
        const onlyCompany =
          user.companies[0];
        setSelectedCompany(
          onlyCompany
        );
        try {
          const locations =
            await getLocations(
              onlyCompany.id
            );
          if (
            !Array.isArray(locations) ||
            locations.length === 0
          ) {
            return;
          }
          if (locations.length === 1) {
            const onlyLocation =
              locations[0];
            setSelectedStation(
              onlyLocation.id.toString()
            );
            navigatingRef.current =
              true;
            router.replace(
              `/${onlyCompany.slug}/dashboard`
            );
          }
        } catch (error) {
          console.error(
            "Location bootstrap error:",
            error
          );
        }
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