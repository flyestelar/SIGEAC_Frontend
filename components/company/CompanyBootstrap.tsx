"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useGetUserLocationsByCompanyId } from "@/hooks/sistema/usuario/useGetUserLocationsByCompanyId";
import { useCompanyStore } from "@/stores/CompanyStore";
import CompanySelect from "@/components/selects/CompanySelect";

const CompanyBootstrap = () => {
  const router = useRouter();

  const { user, loading: userLoading } = useAuth();

  const [ready, setReady] = useState(false);

  const navigatingRef = useRef(false);

  const {
    selectedCompany,
    selectedStation,
    setSelectedCompany,
    setSelectedStation,
    initFromLocalStorage,
    reset,
  } = useCompanyStore();

  const {
    mutateAsync: getLocations,
    isPending: locationsLoading,
  } = useGetUserLocationsByCompanyId();

  useEffect(() => {
    initFromLocalStorage();
    setReady(true);
  }, [initFromLocalStorage]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!ready || userLoading || !user || navigatingRef.current)
        return;

      if (selectedCompany && selectedStation) {
        const companyStillExists = user.companies?.some(
          (c) => c.id === selectedCompany.id
        );

        if (!companyStillExists) {
          reset();
          return;
        }

        try {
          const locations = await getLocations(selectedCompany.id);

          const stationStillExists = locations.some(
            (l) => l.id.toString() === selectedStation
          );

          if (stationStillExists) {
            navigatingRef.current = true;

            router.replace(
              `/${selectedCompany.slug}/dashboard`
            );

            return;
          }

          reset();
        } catch {
          reset();
        }
      }

      if (user.companies?.length === 1) {
        const onlyCompany = user.companies[0];

        setSelectedCompany(onlyCompany);

        try {
          const locations = await getLocations(onlyCompany.id);

          if (locations.length === 1) {
            const onlyLocation = locations[0];

            setSelectedStation(
              onlyLocation.id.toString()
            );

            navigatingRef.current = true;

            router.replace(
              `/${onlyCompany.slug}/dashboard`
            );
          }
        } catch (error) {
          console.error(error);
        }
      }
    };

    bootstrap();
  }, [
    ready,
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

  useEffect(() => {
    if (
      selectedCompany &&
      selectedStation &&
      ready &&
      !userLoading &&
      !navigatingRef.current
    ) {
      navigatingRef.current = true;

      router.replace(
        `/${selectedCompany.slug}/dashboard`
      );
    }
  }, [
    selectedCompany,
    selectedStation,
    ready,
    userLoading,
    router,
  ]);

  if (!ready || userLoading || locationsLoading) {
    return (
      <div className="flex items-center justify-center h-[650px]">
        <p className="text-sm text-muted-foreground">
          Cargando configuración...
        </p>
      </div>
    );
  }

  return <CompanySelect />;
};

export default CompanyBootstrap;